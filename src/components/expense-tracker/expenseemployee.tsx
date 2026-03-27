'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { createExpense, listExpenses, todayISO, adminVerifyExpense } from './expenseApi';

import { Snackbar, Alert, MenuItem, Select } from '@mui/material';

/** =========================
 * Helpers
 * ========================= */
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

// normalize attachments fields (string | object | array)
const normalizeUrls = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);

  if (typeof val === 'object') {
    const possible =
      val.url || val.path || val.location || val.key || val.file || val.link || null;
    return possible ? [String(possible)] : [];
  }

  return [String(val)];
};

// small helper: get label from options
function getOptionLabel(
  value: string | undefined,
  options: readonly { label: string; value: string }[],
): string | undefined {
  if (!value) return undefined;
  const found = options.find((o) => o.value === value);
  return found?.label;
}

/** =========================
 * Options
 * ========================= */
const companyAdminOptions = [
  { label: 'Choose Category', value: '' },
  { label: 'Cake', value: 'cake' },
  { label: 'Advance Payment', value: 'advance_payment' },
  { label: 'Stationary', value: 'stationary' },
  { label: 'Water', value: 'water' },
  { label: 'Tea', value: 'tea' },
  { label: 'Internet', value: 'internet' },
  { label: 'Lease Line', value: 'lease_line' },
  { label: 'Leave Encasement', value: 'leave_encashment' },
  { label: 'Dialer', value: 'dialer' },
  { label: 'SIM', value: 'sim' },
  { label: 'Cloud / AI', value: 'cloud_ai' },
  { label: 'AWS Server', value: 'aws_server' },
  { label: 'Rent - Bareilly', value: 'rent_bareilly' },
  { label: 'Rent - Noida First Floor', value: 'rent_noida_first_floor' },
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
  { label: 'convince & Petrol', value: 'conveyance_petrol' },
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
  { label: 'Other', value: 'other' },
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
  { label: 'Management Expense(Harpreet Singh)', value: 'management' },
  { label: 'Management Expense(Abhinav Awal)', value: 'managementabhinav' },
] as const;

type CompanyApprovalValue = (typeof companyApprovalOptions)[number]['value'];

// const ALLOWED_TEAM_IDS: string[] = [
//   '674abf192cb3ff920ea4a894',
//   '680789b86a3572ff9478bcd2',
//   '68078bdd6a3572ff9478bd50',
//   '68078c506a3572ff9478bd6c',
//   '68e8feb4fa8c01760efccf87',
//   '693d0c7f5c4e2f15ce95cf0b',
//   '6957a5422381863817eb481d',
//   '695cb6645585adfa28e9bea3',
//   '695ce778b71faf497ee89a54',
//   '695df229e3d5943c537019ce',
// ];

type TeamType = { _id: string; name: string; code: string };

type TeamConfig = {
  categories: CompanyAdminValue[];
  approvals: CompanyApprovalValue[];
};

// const TEAM_CONFIG_MAP: Record<string, TeamConfig> = {
//   // admin
//   '674abf192cb3ff920ea4a894': {
//     categories: [
//       'advance_payment',
//       'leave_encashment',
//       'conveyance_petrol',
//       'travel_reimbursement',
//       'overtime',
//       'bonus',
//       'incentives',
//       'other',
//       'expense_channel',
//       'payout',
//       'cashback_to_customer',
//       'referral_partner',
//       'Harpreet_singh_Management',
//       'Abhinav_Awal_Management',
//     ],
//     approvals: ['company_approval'],
//   },
//   // HR
//   '680789b86a3572ff9478bcd2': {
//     categories: [
//       'cake',
//       'stationary',
//       'tea',
//       'water',
//       'decor',
//       'gifting',
//       'food_beverages',
//       'company_outing',
//       'overtime',
//       'rent_noida_first_floor',
//       'rent_bareilly',
//       'bonus',
//       'contests',
//       'leave_encashment',
//       'advance_payment',
//       'other',
//     ],
//     approvals: ['company_approval'],
//   },
//   // Sales
//   '68078bdd6a3572ff9478bd50': {
//     categories: [
//       'data_purchase',
//       'overtime',
//       'advertisement',
//       'conveyance_petrol',
//       'cab',
//       'travel_reimbursement',
//       'collab_events_marketing',
//       'community_building_expense',
//       'food_beverages',
//       'incentives',
//       'contests',
//       'other',
//     ],
//     approvals: ['company_approval', 'expense_channel'],
//   },
//   '6957a5422381863817eb481d': {
//     categories: [
//       'sim',
//       'system_rent',
//       'advance_payment',
//       'dialer',
//       'travel_reimbursement',
//       'internet',
//       'incentives',
//       'bonus', 'overtime', 
//       'cloud_ai',
//       'other',
//     ],
//     approvals: ['company_approval', 'expense_channel'],
//   },
//   '68078c506a3572ff9478bd6c': {
//     categories: ['bonus', 'overtime', 'advance_payment', 'incentives', 'cloud_ai', 'other'],
//     approvals: ['company_approval', 'expense_channel'],
//   },
//   // admin (final)
//   '695df229e3d5943c537019ce': {
//     categories: [
//       'stationary',
//       'water',
//       'tea',
//       'repairs',
//       'maintenance',
//       'conveyance_petrol',
//       'food_beverages',
//       'Harpreet_singh_Management',
//       'Abhinav_Awal_Management',

//       'other',
//     ],
//     approvals: ['company_approval', 'expense_channel'],
//   },
//   '695ce778b71faf497ee89a54': {
//     categories: [
//       'payout',
//       'gifting',
//       'data_purchase',
//       'advance_payment',
//       'rent_bareilly',
//       'rent_noida_first_floor',
//       'company_outing',
//       'it_consultancy',
//       'conveyance_petrol',
//       'food_beverages',
//       'referral_partner',
//       'Harpreet_singh_Management',
//       'community_building_expense',
//       'Abhinav_Awal_Management',
//       'other',
//     ],
//     approvals: ['company_approval', 'expense_channel'],
//   },
//   '68e8feb4fa8c01760efccf87': {
//     categories: [
//       'bonus',
//       'cab',
//       'payout',
//       'overtime',
//       'advance_payment',

//       'cashback_to_customer',
//       'expense_channel',
//       'Harpreet_singh_Management',
//       'Abhinav_Awal_Management',
//       'other',
//     ],
//     approvals: ['company_approval', 'expense_channel'],
//   },
//   '695cb6645585adfa28e9bea3': {
//     categories: ['bonus', 'overtime', 'Harpreet_singh_Management', 'Abhinav_Awal_Management', 'other'],
//     approvals: ['company_approval', 'expense_channel'],
//   },
//   '693d0c7f5c4e2f15ce95cf0b': {
//     categories: [
//       'bonus',
//       'payout',
//       'incentives',
//       'overtime',
//       'cashback_to_customer',
//       'expense_channel',
//       'referral_partner',
//       'company_approval',
//       'data_purchase',
//       'Harpreet_singh_Management',
//       'Abhinav_Awal_Management',
//       'advance_payment',
//       'travel_reimbursement',
//       'community_building_expense',
//       'other',
//     ],
//     approvals: ['company_approval', 'expense_channel'],
//   },
// };

type EmployeeType = {
  _id: string;
  first_name: string;
  last_name: string;
};

type UserLS = {
  employee_id?: string;
  _id?: string;
  id?: string;
  role?: number | string;
  role_id?: number | string;
  user_role?: number | string;
  employee_role?: number | string;
};

type PaymentMode = 'account' | 'upi' | 'qr';

/** =========================
 * API helpers (UPDATE + SOFT DELETE)
 * ========================= */
async function updateExpenseRequest(id: string, body: Record<string, any>, files: File[]) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const companyId =
    (typeof window !== 'undefined' && (localStorage.getItem('company_id') || (user as any).company_id)) || '';

  const fd = new FormData();
  Object.entries(body).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    fd.append(k, String(v));
  });
  files.forEach((f) => fd.append('invoices', f));

  const res = await fetch(`${base}/expense-tracker/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId,
    } as any,
    body: fd,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to update expense');
  }

  return res.json();
}

async function softDeleteExpenseRequest(id: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const companyId =
    (typeof window !== 'undefined' && (localStorage.getItem('company_id') || (user as any).company_id)) || '';

  const res = await fetch(`${base}/expense-tracker/${encodeURIComponent(id)}/delete`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-company-id': companyId,
    } as any,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to delete expense');
  }

  return res.json();
}

/** =========================
 * UI tokens
 * ========================= */
const ui = {
  pageBg:
    'radial-gradient(1200px 700px at 15% 0%, rgba(99,102,241,0.18) 0%, rgba(59,130,246,0.10) 30%, rgba(248,250,252,1) 70%)',
  cardBg: '#ffffff',
  text: '#0b1220',
  muted: '#5b6b85',
  border: 'rgba(15,23,42,0.10)',
  border2: 'rgba(15,23,42,0.16)',
  shadow: '0 18px 60px rgba(2, 6, 23, 0.10)',
  shadowSoft: '0 10px 30px rgba(2, 6, 23, 0.08)',
  radius: 18,
  radiusSm: 14,
  primary: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 55%, #0284c7 100%)',
  danger: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${ui.border}`,
  background: 'rgba(248,250,252,0.85)',
  outline: 'none',
  fontSize: 13,
  color: ui.text,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
};

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

const pillPrimary: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: 999,
  border: 'none',
  background: ui.primary,
  color: '#fff',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(79,70,229,0.20)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
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

const pillGhost: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: 999,
  border: `1px solid ${ui.border2}`,
  background: 'rgba(248,250,252,0.85)',
  color: ui.text,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
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

const tinyBtn: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 999,
  border: `1px solid ${ui.border2}`,
  background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.92) 100%)',
  fontSize: 11,
  cursor: 'pointer',
  fontWeight: 900,
  color: ui.text,
  boxShadow: '0 6px 14px rgba(2,6,23,0.06)',
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

const label = (txt: string) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: ui.muted,
      marginBottom: 6,
    }}
  >
    {txt}
  </div>
);

const money = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? '');
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
};

// ✅ status can be string or object; keep safe
const statusBadge = (status?: any) => {
  const raw =
    typeof status === 'object' ? status?.status ?? status?.value ?? status?.name ?? '' : status;

  const s = String(raw || '').toLowerCase();

  const cfg =
    s === 'approved'
      ? { bg: 'rgba(34,197,94,0.12)', bd: 'rgba(34,197,94,0.35)', fg: '#166534', dot: '#22c55e' }
      : s === 'rejected'
        ? { bg: 'rgba(239,68,68,0.12)', bd: 'rgba(239,68,68,0.35)', fg: '#7f1d1d', dot: '#ef4444' }
        : { bg: 'rgba(245,158,11,0.12)', bd: 'rgba(245,158,11,0.35)', fg: '#92400e', dot: '#f59e0b' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${cfg.bd}`,
        background: cfg.bg,
        color: cfg.fg,
        fontSize: 11,
        fontWeight: 900,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 99, background: cfg.dot }} />
      {s || 'pending'}
    </span>
  );
};

const EyeIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Try to find QR image url from row:
// 1) explicit qr_image_url/qr_url/qr_image
// 2) fallback to first invoice image (if payment indicates QR)
const getQrUrlFromRow = (r: any) => {
  const direct =
    r?.qr_image_url || r?.qr_url || r?.qr_image || r?.qrImageUrl || r?.qrImage || null;
  if (direct) return String(direct);

  const inv: string[] = Array.isArray(r?.invoices) ? r.invoices : [];
  const firstImg = inv.find((u) => isImageUrl(u));
  return firstImg || null;
};

export default function ExpenseEmployee() {
  const defaultDate = useMemo(() => todayISO(), []);

  const employees = useSelector(
    (state: RootState) => (state as any)?.employees?.employees || [],
  ) as EmployeeType[];

  const { myIds, isAdmin } = useMemo(() => {
    if (typeof window === 'undefined') return { myIds: [] as string[], isAdmin: false };

    const user: UserLS = JSON.parse(localStorage.getItem('user') || '{}');

    const ids = [user?.employee_id, user?._id, user?.id]
      .filter(Boolean)
      .map((x) => String(x).trim());

    const rRaw = user?.role ?? user?.role_id ?? user?.user_role ?? user?.employee_role ?? 0;
    const r = Number(rRaw) || 0;

    return { myIds: Array.from(new Set(ids)), isAdmin: r === 1 };
  }, []);

  const empMap = useMemo(() => {
    const m = new Map<string, string>();
    (employees || []).forEach((e) => {
      if (!e?._id) return;
      m.set(String(e._id), `${e.first_name} ${e.last_name}`.trim());
    });
    return m;
  }, [employees]);

  const getEmpName = (idOrObj: any) => {
    if (!idOrObj) return '-';
    if (typeof idOrObj === 'object') {
      const _id = idOrObj?._id;
      if (_id && empMap.has(_id)) return empMap.get(_id)!;
      if (idOrObj?.first_name) return `${idOrObj.first_name} ${idOrObj.last_name || ''}`.trim();
      return _id || '-';
    }
    return empMap.get(String(idOrObj)) || String(idOrObj);
  };

  /** =========================
   * Snackbar
   * ========================= */
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, msg: '', severity: 'success' });

  const showSnack = (
    msg: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'success',
  ) => setSnack({ open: true, msg, severity });

  /** =========================
   * Form states
   * ========================= */
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [date, setDate] = useState(defaultDate);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState<string>('');

  const [companyAdmin, setCompanyAdmin] = useState<CompanyAdminValue>('');
  const [customCategory, setCustomCategory] = useState('');

  const [companyApproval, setCompanyApproval] =
    useState<CompanyApprovalValue>('company_approval');

  const [paidAmount, setPaidAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [invoices, setInvoices] = useState<File[]>([]);

  const [managerId] = useState<string>('');

  const [expenseChannel, setExpenseChannel] = useState('');
  const [cashbackToCustomer, setCashbackToCustomer] = useState(false);
  const [referralPartner, setReferralPartner] = useState('');

  const [teams, setTeams] = useState<TeamType[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [department, setDepartment] = useState(''); // team_id
  const [invoiceDate, setInvoiceDate] = useState<string>(''); // YYYY-MM-DD

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('account');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrNote, setQrNote] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);

  /** =========================
   * List states
   * ========================= */
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  const [descPreview, setDescPreview] = useState<string | null>(null);
  const [paymentMeta, setPaymentMeta] = useState<any | null>(null);

  const totalPages = Math.max(1, Math.ceil((total || 0) / 10));
  const isOther = companyAdmin === 'other';

  const resetForm = () => {
    setDate(defaultDate);
    setExpectedPaymentDate('');
    setCompanyAdmin('cake');
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
    setDepartment('');
    setInvoiceDate('');
  };

  // const filteredCompanyAdminOptions = useMemo(() => {
  //   if (!department) return companyAdminOptions.filter((o) => o.value === '');
  //   const allowed = TEAM_CONFIG_MAP[String(department)]?.categories || [];
  //   return companyAdminOptions.filter((o) => o.value === '' || allowed.includes(o.value));
  // }, [department]);

  const filteredCompanyAdminOptions = companyAdminOptions;

  const load = async () => {
    try {
      setLoadingList(true);

      if (!isAdmin && myIds.length === 0) {
        setRows([]);
        setTotal(0);
        return;
      }

      const res = await listExpenses({
        page,
        limit: 10,
        owner_id: isAdmin ? undefined : myIds[0],
      });

      const data = Array.isArray(res?.data) ? res.data : [];

      const safeRows = isAdmin
        ? data
        : data.filter((r: any) => {
          const oid = String(r?.owner_id?._id ?? r?.owner_id ?? '').trim();
          return myIds.includes(oid);
        });

      setRows(safeRows);
      setTotal(isAdmin ? res?.total || 0 : safeRows.length);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

        const token = localStorage.getItem('token') || '';
        const user =
          typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem('user') || '{}')
            : {};
        const company_id = (user as any)?.company_id || '';
        const cid = localStorage.getItem('company_id') || company_id || '';

        const resp = await fetch(`${base}/teams/get-allowed-team`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-company-id': company_id,
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

        const teamArr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.teams)
            ? json.teams
            : Array.isArray(json?.data)
              ? json.data
              : [];

        let filteredTeams = teamArr;
        // if (ALLOWED_TEAM_IDS.length) {
        //   filteredTeams = teamArr.filter((t: any) => ALLOWED_TEAM_IDS.includes(String(t._id)));
        // }

        const cleaned: TeamType[] = filteredTeams
          .map((t: any) => ({ _id: String(t._id), name: t.name || '', code: t.code || '' }))
          .filter((t) => t._id);

        cleaned.sort((a, b) =>
          String(a.name || a.code || '').localeCompare(String(b.name || b.code || '')),
        );

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAdmin, myIds.join('|')]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) return showSnack('Submission date required', 'warning');
    if (!companyAdmin) return showSnack('Company Admin required', 'warning');
    if (isOther && !customCategory.trim()) return showSnack('Please enter Other expense name', 'warning');
    if (!companyApproval) return showSnack('More Expense Type required', 'warning');
    if (!paidAmount.trim()) return showSnack('Paid amount required', 'warning');

    const amt = Number(paidAmount);
    if (!Number.isFinite(amt) || amt <= 0) return showSnack('Paid amount must be valid number', 'warning');

    if (companyApproval === 'expense_channel' && !expenseChannel.trim())
      return showSnack('Expense Channel required', 'warning');
    if (companyApproval === 'referral_partner' && !referralPartner.trim())
      return showSnack('Referral Partner required', 'warning');

    let payment: string | undefined;

    if (paymentMode === 'account') {
      if (!accountHolder.trim() || !bankName.trim() || !accountNumber.trim() || !ifsc.trim()) {
        return showSnack('Account Holder, Bank Name, Account Number & IFSC are required', 'warning');
      }
      const parts = [
        'Account Transfer',
        `Name: ${accountHolder.trim()}`,
        `Bank: ${bankName.trim()}`,
        `A/c: ${accountNumber.trim()}`,
        `IFSC: ${ifsc.trim()}`,
      ];
      payment = parts.join(' | ');
    } else if (paymentMode === 'upi') {
      if (!upiId.trim()) return showSnack('UPI ID is required', 'warning');
      payment = `UPI | ID: ${upiId.trim()}`;
    } else if (paymentMode === 'qr') {
      payment = `QR Payment${qrNote.trim() ? ' | ' + qrNote.trim() : ''}`;
    }

    const allFiles: File[] = [...invoices, ...(qrFile ? [qrFile] : [])];

    const payload: any = {
      date,
      invoice_date: invoiceDate || undefined,
      department: department || undefined,
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
        await updateExpenseRequest(editingId, payload, allFiles);
        showSnack('Expense updated ✅', 'success');
      } else {
        await createExpense(payload, allFiles);
        showSnack('Expense created ✅', 'success');
      }

      resetForm();
      setEditingId(null);
      setOpen(false);
      setPage(1);
      await load();
    } catch (err: any) {
      showSnack(err?.message || 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showCategory = (r: any) => {
    const adminCat: string | undefined = r?.company_admin;
    const type: string | undefined = r?.company_approval;
    const custom: string | undefined = r?.custom_category;

    if (adminCat === 'other') return custom || 'Other';
    if ((!adminCat || adminCat === 'cake') && type)
      return getOptionLabel(type, companyApprovalOptions) || type;
    if (adminCat) return getOptionLabel(adminCat, companyAdminOptions) || adminCat;
    if (type) return getOptionLabel(type, companyApprovalOptions) || type;
    return '-';
  };

  async function verify(id: string, status: 'approved' | 'rejected') {
    try {
      if (!isAdmin) return;
      await adminVerifyExpense(id, { status, note });
      setSelectedId('');
      setNote('');
      await load();
      showSnack(`Marked ${status} ✅`, 'success');
    } catch (err: any) {
      showSnack(err?.response?.data?.message || err?.message || 'Error', 'error');
    }
  }

  const handleEdit = (r: any) => {
    setEditingId(r._id);
    setOpen(true);

    setDate(r.date || defaultDate);
    setExpectedPaymentDate(r.expected_payment_date || '');
    setCompanyAdmin((r.company_admin as CompanyAdminValue) || 'cake');
    setCustomCategory(r.custom_category || '');
    setCompanyApproval((r.company_approval as CompanyApprovalValue) || 'company_approval');
    setPaidAmount(String(r.paid_amount || ''));
    setDescription(r.description || '');
    setExpenseChannel(r.expense_channel || '');
    setCashbackToCustomer(!!r.cashback_to_customer);
    setReferralPartner(r.referral_partner || '');

    setInvoices([]);
    setQrFile(null);

    const p = String(r.payment || '').trim();

    let mode: PaymentMode = 'account';
    let accHolder = '';
    let bank = '';
    let accNo = '';
    let ifscVal = '';
    let upi = '';
    let qrN = '';

    if (p.startsWith('Account Transfer')) {
      mode = 'account';
      const parts = p.split('|').map((s) => s.trim());
      parts.forEach((part) => {
        if (part.startsWith('Name:')) accHolder = part.replace('Name:', '').trim();
        else if (part.startsWith('Bank:')) bank = part.replace('Bank:', '').trim();
        else if (part.startsWith('A/c:')) accNo = part.replace('A/c:', '').trim();
        else if (part.startsWith('IFSC:')) ifscVal = part.replace('IFSC:', '').trim();
      });
    } else if (p.startsWith('UPI')) {
      mode = 'upi';
      const parts = p.split('|').map((s) => s.trim());
      const idPart = parts.find((x) => x.startsWith('ID:'));
      if (idPart) upi = idPart.replace('ID:', '').trim();
    } else if (p.startsWith('QR Payment')) {
      mode = 'qr';
      const parts = p.split('|').map((s) => s.trim());
      if (parts.length > 1) qrN = parts.slice(1).join(' | ');
    }

    setPaymentMode(mode);
    setAccountHolder(accHolder);
    setBankName(bank);
    setAccountNumber(accNo);
    setIfsc(ifscVal);
    setUpiId(upi);
    setQrNote(qrN);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await softDeleteExpenseRequest(id);
      if (editingId === id) {
        resetForm();
        setEditingId(null);
        setOpen(false);
      }
      await load();
      alert('Expense deleted ✅');
    } catch (err: any) {
      alert(err?.message || 'Error');
    }
  };

  // ✅ correct colspans
  const colSpanCount = isAdmin ? 10 : 8;

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 1180,
        margin: '0 auto',
        minHeight: '100vh',
        background: ui.pageBg,
      }}
    >
      <style jsx global>{`
        .exp-row {
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }
        .exp-row:hover {
          background: rgba(255, 255, 255, 0.98) !important;
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.06) inset;
        }
      `}</style>

      {/* Sticky Top Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          padding: '10px 0 12px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            borderRadius: ui.radius,
            padding: 14,
            background: 'rgba(255,255,255,0.78)',
            border: `1px solid ${ui.border}`,
            boxShadow: ui.shadowSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: ui.text }}>
              {isAdmin ? 'All Expenses' : 'My Expenses'}
            </div>
            <div style={{ fontSize: 12, color: ui.muted }}>
              Requests, invoices, payment details & admin approvals.
            </div>
          </div>

          <button
            onClick={() => {
              if (open && editingId) {
                resetForm();
                setEditingId(null);
              }
              setOpen((v) => !v);
            }}
            style={{
              ...pillPrimary,
              background: open ? ui.danger : ui.primary,
              boxShadow: open
                ? '0 10px 20px rgba(239,68,68,0.18)'
                : '0 10px 20px rgba(79,70,229,0.20)',
            }}
          >
            {open ? (editingId ? 'Cancel Edit' : 'Close Form') : '+ Create Expense'}
          </button>
        </div>
      </div>

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
                    disabled={false}
                    onChange={(e) => setCompanyAdmin(e.target.value as CompanyAdminValue)}
                    // disabled={!department}
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
      <div style={{ marginTop: 16, ...cardStyle, overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 14px',
            borderBottom: `1px solid ${ui.border}`,
            background: 'rgba(255,255,255,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 900, color: ui.text }}>Expense Records</div>
          <div style={{ fontSize: 12, color: ui.muted }}>
            Showing <b>{rows.length}</b> / <b>{total || rows.length}</b>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {[
                  'Date',
                  'Release Date',
                  'Invoice Date',

                  ...(isAdmin ? (['Employee', 'Manager'] as const) : ([] as const)),
                  //    'Contact',
                  // 'Email',
                  // 'Branch',
                  'Department',
                  'Category',
                  'Expense Type',
                  'Amount',
                  'Description',
                  'Payment Details',
                  'Admin Status',
                  'Invoices',
                  'Admin Attachment',
                  'Action',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      fontSize: 12,
                      padding: 12,
                      borderBottom: `1px solid ${ui.border}`,
                      background: 'rgba(248,250,252,0.95)',
                      color: ui.muted,
                      fontWeight: 900,
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
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
                rows.map((r, idx) => {
                  const canVerify = isAdmin && r.admin_status === 'pending';
                  const zebra = idx % 2 === 0;

                  return (
                    <tr
                      key={r._id}
                      className="exp-row"
                      style={{ background: zebra ? 'rgba(255,255,255,0.90)' : 'rgba(248,250,252,0.70)' }}
                    >
                      {/* Date */}
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {r.date}
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {r.expected_payment_date}
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {r.invoice_date}
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {typeof r.department === 'object'
                          ? (r.department?.name || r.department?.code || r.department?._id || '-')
                          : (r.department || '-')}
                      </td>


                      {/* Admin columns */}
                      {isAdmin ? (
                        <>
                          <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12 }}>
                            {getEmpName(r.owner_id)}
                          </td>
                          <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12 }}>
                            {getEmpName(r.manager_id)}
                          </td>
                        </>
                      ) : null}

                      {/* Category */}
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12 }}>
                        {showCategory(r)}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        {(r.company_approval)}
                      </td>

                      {/* Paid */}
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>
                        {money(r.paid_amount)}
                      </td>

                      {/* ✅ Description with view icon */}
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, maxWidth: 280 }}>
                        {r.description ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 200,
                                color: ui.text,
                                fontWeight: 700,
                              }}
                              title={r.description}
                            >
                              {r.description}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDescPreview(String(r.description))}
                              style={{ ...tinyBtn, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              title="View Description"
                            >
                              <EyeIcon />

                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: ui.muted }}>—</span>
                        )}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, maxWidth: 320 }}>
                        {r.payment ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 220,
                                color: ui.text,
                                fontWeight: 700,
                              }}
                              title={r.payment}
                            >
                              {r.payment}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setPaymentMeta({
                                  payment: r.payment,
                                  payment_mode: r.payment_mode,
                                  qr: getQrUrlFromRow(r),
                                })
                              }
                              style={{ ...tinyBtn, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                              title="View Payment"
                            >
                              <EyeIcon />

                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: ui.muted }}>—</span>
                        )}
                      </td>

                      {/* Admin Status */}
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12 }}>
                        {statusBadge(r.admin_status)}
                      </td>


                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}` }}>
                        {(() => {
                          const invoiceUrls: string[] = Array.isArray(r.invoices) ? r.invoices : [];

                          const isQrPay = String(r?.payment || '').toLowerCase().includes('qr');
                          const qrUrl = isQrPay ? getQrUrlFromRow(r) : null;

                          // remove QR image from invoice list
                          const onlyInvoices = qrUrl
                            ? invoiceUrls.filter((u) => String(u) !== String(qrUrl))
                            : invoiceUrls;

                          if (!onlyInvoices.length) {
                            return <span style={{ fontSize: 11, color: ui.muted }}>No invoice</span>;
                          }

                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              {onlyInvoices.map((url: string, i: number) => {
                                const name = prettyFileName(url) || `Invoice ${i + 1}`;
                                const img = isImageUrl(url);

                                return (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: '8px 12px',
                                      borderRadius: 14,
                                      border: `1px solid ${ui.border}`,
                                      background: 'rgba(255,255,255,0.9)',
                                      boxShadow: '0 8px 18px rgba(2,6,23,0.06)',
                                      textDecoration: 'none',
                                      color: ui.text,
                                      maxWidth: 300,
                                    }}
                                  >
                                    {/* 🔥 REAL IMAGE PREVIEW */}
                                    {img ? (
                                      <img
                                        src={url}
                                        alt={name}
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: 8,
                                          objectFit: 'cover',
                                          border: `1px solid ${ui.border2}`,
                                          flexShrink: 0,
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: 8,
                                          background: 'rgba(79,70,229,0.12)',
                                          border: `1px solid rgba(79,70,229,0.25)`,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 900,
                                          color: '#4338ca',
                                          fontSize: 11,
                                          flexShrink: 0,
                                        }}
                                      >
                                        PDF
                                      </div>
                                    )}

                                    {/* filename */}
                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 900,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: 180,
                                      }}
                                      title={name}
                                    >
                                      {name}
                                    </span>

                                    <span style={{ marginLeft: 'auto', color: ui.muted, fontWeight: 900 }}>↗</span>
                                  </a>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}` }}>
                        {(() => {
                          const urls =
                            normalizeUrls(r.admin_attachments).length
                              ? normalizeUrls(r.admin_attachments)
                              : normalizeUrls(r.admin_attachment);

                          if (!urls.length) return <span style={{ fontSize: 11, color: ui.muted }}>—</span>;

                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              {urls.map((url: string, i: number) => {
                                const name = prettyFileName(url) || `Admin File ${i + 1}`;
                                const img = isImageUrl(url);

                                return (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: '8px 12px',
                                      borderRadius: 14,
                                      border: `1px solid ${ui.border}`,
                                      background: 'rgba(255,255,255,0.9)',
                                      boxShadow: '0 8px 18px rgba(2,6,23,0.06)',
                                      textDecoration: 'none',
                                      color: ui.text,
                                      maxWidth: 300,
                                    }}
                                  >
                                    {img ? (
                                      <img
                                        src={url}
                                        alt={name}
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: 8,
                                          objectFit: 'cover',
                                          border: `1px solid ${ui.border2}`,
                                          flexShrink: 0,
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: 8,
                                          background: 'rgba(16,185,129,0.12)',
                                          border: '1px solid rgba(16,185,129,0.25)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 900,
                                          color: '#047857',
                                          fontSize: 11,
                                          flexShrink: 0,
                                        }}
                                      >
                                        PDF
                                      </div>
                                    )}

                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 900,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: 180,
                                      }}
                                      title={name}
                                    >
                                      {name}
                                    </span>

                                    <span style={{ marginLeft: 'auto', color: ui.muted, fontWeight: 900 }}>↗</span>
                                  </a>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Action */}
                      <td style={{ padding: 12, borderBottom: `1px solid ${ui.border}`, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {isAdmin ? (
                          <button
                            disabled={!canVerify}
                            onClick={() => setSelectedId(r._id)}
                            style={{
                              ...pillPrimary,
                              padding: '8px 12px',
                              fontSize: 12,
                              opacity: canVerify ? 1 : 0.5,
                              cursor: canVerify ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Verify
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(r)}
                              style={{
                                ...pillGhost,
                                padding: '8px 12px',
                                borderColor: 'rgba(79,70,229,0.30)',
                                background: 'rgba(79,70,229,0.08)',
                              }}
                            >
                              Edit
                            </button>
                            {/* <button
                              type="button"
                              onClick={() => handleDelete(r._id)}
                              style={{
                                ...pillGhost,
                                padding: '8px 12px',
                                borderColor: 'rgba(239,68,68,0.35)',
                                background: 'rgba(239,68,68,0.08)',
                                color: '#b91c1c',
                              }}
                            >
                              Delete
                            </button> */}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {loadingList && (
                <tr>
                  <td colSpan={colSpanCount} style={{ padding: 14, fontSize: 12, color: ui.muted }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loadingList && rows.length === 0 && (
                <tr>
                  <td colSpan={colSpanCount} style={{ padding: 14, fontSize: 12, color: ui.muted }}>
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN VERIFY BOX */}
      {isAdmin && selectedId && (
        <div style={{ marginTop: 14, ...cardStyle, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: ui.text }}>Admin Verify Expense</div>
            <button
              onClick={() => {
                setSelectedId('');
                setNote('');
              }}
              style={pillGhost}
            >
              Close
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            {label('Note')}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ ...inputBase, minHeight: 90, resize: 'vertical' }}
              placeholder="Add a note for approval / rejection..."
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => verify(selectedId, 'approved')}
              style={{ ...pillPrimary, background: ui.success, boxShadow: '0 10px 20px rgba(34,197,94,0.18)' }}
            >
              Approve
            </button>
            <button
              onClick={() => verify(selectedId, 'rejected')}
              style={{ ...pillPrimary, background: ui.danger, boxShadow: '0 10px 20px rgba(239,68,68,0.18)' }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* ✅ DESCRIPTION DIALOG */}
      {descPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              maxWidth: 560,
              width: '100%',
              padding: 16,
              boxShadow: '0 20px 60px rgba(15,23,42,0.35)',
              border: `1px solid ${ui.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: ui.text }}>Description</div>
              <button
                type="button"
                onClick={() => setDescPreview(null)}
                style={{
                  border: `1px solid ${ui.border2}`,
                  background: 'rgba(248,250,252,0.95)',
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  color: ui.text,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65, color: ui.text }}>
              {descPreview}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" onClick={() => setDescPreview(null)} style={pillPrimary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ PAYMENT DETAILS DIALOG (with QR image if available) */}
      {paymentMeta?.payment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 55,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              maxWidth: 640,
              width: '100%',
              padding: 16,
              boxShadow: '0 20px 60px rgba(15,23,42,0.35)',
              border: `1px solid ${ui.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 12,
                margin: -16,
                marginBottom: 12,
                borderBottom: `1px solid ${ui.border}`,
                background:
                  'linear-gradient(135deg, rgba(79,70,229,0.14) 0%, rgba(37,99,235,0.10) 45%, rgba(2,132,199,0.08) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: ui.text }}>Payment Details</div>
              <button
                type="button"
                onClick={() => setPaymentMeta(null)}
                style={{
                  border: `1px solid ${ui.border2}`,
                  background: 'rgba(255,255,255,0.9)',
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  color: ui.text,
                }}
              >
                ×
              </button>
            </div>

            {/* QR preview if payment is QR and we have image */}
            {String(paymentMeta?.payment || '').toLowerCase().includes('qr') && paymentMeta?.qr ? (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 16,
                  background:
                    'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.90) 100%)',
                  border: `1px solid ${ui.border}`,
                  boxShadow: '0 10px 24px rgba(2,6,23,0.08)',
                  marginBottom: 12,
                }}
              >
                <img
                  src={paymentMeta.qr}
                  alt="QR"
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 22,
                    objectFit: 'cover',
                    border: `1px solid ${ui.border2}`,
                    boxShadow: '0 14px 34px rgba(2,6,23,0.18)',
                    background: '#fff',
                    padding: 6,
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <a
                    href={paymentMeta.qr}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      marginTop: 10,
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#1d4ed8',
                      textDecoration: 'none',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                  </a>
                </div>
              </div>
            ) : null}

            <div
              style={{
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.65,
                padding: '6px 0 4px',
                color: ui.text,
              }}
            >
              {paymentMeta.payment}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" onClick={() => setPaymentMeta(null)} style={pillPrimary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, justifyContent: 'flex-end' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{ ...pillGhost, padding: '8px 12px', fontSize: 12, opacity: page <= 1 ? 0.6 : 1 }}
        >
          Prev
        </button>

        <div style={{ fontSize: 12, color: ui.text }}>
          Page <b>{page}</b> / <b>{totalPages}</b>
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          style={{ ...pillGhost, padding: '8px 12px', fontSize: 12, opacity: page >= totalPages ? 0.6 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
