// =======================================
// ✅ ExpenseEmployee.tsx (PREMIUM UI + DESCRIPTION VIEW + PAYMENT VIEW + QR IN PAYMENT MODAL + INVOICE ONLY)
// =======================================
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

import { createExpense, listExpenses, todayISO, adminVerifyExpense } from './expenseApi';

// -------- helpers ----------
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

// -------- options ----------
const companyAdminOptions = [
  { label: 'Cake', value: 'cake' },
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
  { label: 'Advance From Company', value: 'data_purchase' },
  { label: 'HR Admin Expense', value: 'managementabhinav' },
  { label: 'Management Expense(Harpreet Singh)', value: 'management' },
  { label: 'Management Expense(Abhinav Awal)', value: 'managementabhinav' },
] as const;

type CompanyApprovalValue = (typeof companyApprovalOptions)[number]['value'];

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

// 🆕 payment mode type
type PaymentMode = 'account' | 'upi' | 'qr';

// small helper: get label from options
function getOptionLabel(
  value: string | undefined,
  options: readonly { label: string; value: string }[],
): string | undefined {
  if (!value) return undefined;
  const found = options.find((o) => o.value === value);
  return found?.label;
}

// 🆕 Local API helpers for UPDATE + SOFT DELETE (multipart)
async function updateExpenseRequest(id: string, body: Record<string, any>, files: File[]) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const user =
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const companyId =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('company_id') || (user as any).company_id)) ||
    '';

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
  const user =
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const companyId =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('company_id') || (user as any).company_id)) ||
    '';

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
 * ✅ PREMIUM UI TOKENS (Improved Colors)
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

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: 'none',
};

const cardStyle: React.CSSProperties = {
  borderRadius: ui.radius,
  background: ui.cardBg,
  border: `1px solid ${ui.border}`,
  boxShadow: ui.shadow,
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

const statusBadge = (status?: string) => {
  const s = String(status || '').toLowerCase();
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
    if (typeof window === 'undefined') {
      return { myIds: [] as string[], isAdmin: false };
    }

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

  // ---------- form states ----------
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [date, setDate] = useState(defaultDate);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState<string>('');

  const [companyAdmin, setCompanyAdmin] = useState<CompanyAdminValue>('cake');
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

  // 🆕 Payment mode + fields
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('account');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrNote, setQrNote] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);

  // ---------- list states ----------
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  // 🆕 dialogs
  const [descPreview, setDescPreview] = useState<string | null>(null);
  const [paymentMeta, setPaymentMeta] = useState<any | null>(null);

  const totalPages = Math.max(1, Math.ceil((total || 0) / 10));
  const isOther = companyAdmin === 'other';
  const isLeaveEncashmentFlow = companyApproval === 'leave_encashment';

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
  };

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAdmin, myIds.join('|')]);

  function handleCompanyApprovalChange(val: CompanyApprovalValue) {
    setCompanyApproval(val);

    if (val === 'leave_encashment') {
      setCompanyAdmin('leave_encashment');
    } else {
      if (companyAdmin === 'leave_encashment') {
        setCompanyAdmin('cake');
      }
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) return alert('Submission date required');
    if (!companyAdmin) return alert('Company Admin required');
    if (isOther && !customCategory.trim()) return alert('Please enter Other expense name');
    if (!companyApproval) return alert('More Expense Type required');
    if (!paidAmount.trim()) return alert('Paid amount required');

    const amt = Number(paidAmount);
    if (!Number.isFinite(amt) || amt <= 0) return alert('Paid amount must be valid number');

    if (companyApproval === 'expense_channel' && !expenseChannel.trim())
      return alert('Expense Channel required');
    if (companyApproval === 'referral_partner' && !referralPartner.trim())
      return alert('Referral Partner required');

    // payment string
    let payment: string | undefined;

    if (paymentMode === 'account') {
      if (!accountHolder.trim() || !bankName.trim() || !accountNumber.trim() || !ifsc.trim()) {
        return alert('Account Holder, Bank Name, Account Number & IFSC are required for Account payment');
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
      if (!upiId.trim()) return alert('UPI ID is required');
      payment = `UPI | ID: ${upiId.trim()}`;
    } else if (paymentMode === 'qr') {
      payment = `QR Payment${qrNote.trim() ? ' | ' + qrNote.trim() : ''}`;
    }

    // merge files
    const allFiles: File[] = [...invoices, ...(qrFile ? [qrFile] : [])];

    const payload: any = {
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
        await updateExpenseRequest(editingId, payload, allFiles);
        alert('Expense updated ✅');
      } else {
        await createExpense(payload, allFiles);
        alert('Expense created ✅');
      }

      resetForm();
      setEditingId(null);
      setOpen(false);
      setPage(1);
      await load();
    } catch (err: any) {
      alert(err?.message || 'Error');
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
      alert('Admin verification done ✅');
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error');
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

      {/* CREATE / EDIT FORM */}
      {open && (
        <form onSubmit={onSubmit} style={{ ...cardStyle, overflow: 'hidden', marginTop: 12 }}>
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${ui.border}`,
              background:
                'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(37,99,235,0.10) 40%, rgba(2,132,199,0.06) 70%, rgba(255,255,255,0) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: editingId ? '#f59e0b' : '#4f46e5',
                  boxShadow: editingId
                    ? '0 0 0 6px rgba(245,158,11,0.12)'
                    : '0 0 0 6px rgba(79,70,229,0.12)',
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 900, color: ui.text }}>
                {editingId ? 'Edit Expense' : 'New Expense Request'}
              </div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {/* Date */}
              <div style={{ gridColumn: 'span 3' as any }}>
                {label('Expense Date')}
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  style={inputBase}
                />
              </div>

              {/* Expected Payment Date */}
              <div style={{ gridColumn: 'span 3' as any }}>
                {label('Expected Payment Date')}
                <input
                  type="date"
                  value={expectedPaymentDate}
                  onChange={(e) => setExpectedPaymentDate(e.target.value)}
                  style={inputBase}
                />
              </div>

              {/* Category */}
              <div style={{ gridColumn: 'span 3' as any }}>
                {label(isLeaveEncashmentFlow ? 'Expense Category (auto)' : 'Expense Category')}
                <select
                  value={companyAdmin}
                  onChange={(e) => setCompanyAdmin(e.target.value as CompanyAdminValue)}
                  style={selectBase}
                  disabled={isLeaveEncashmentFlow}
                >
                  {companyAdminOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expense Type */}
              <div style={{ gridColumn: 'span 3' as any }}>
                {label('Expense Type')}
                <select
                  value={companyApproval}
                  onChange={(e) => handleCompanyApprovalChange(e.target.value as CompanyApprovalValue)}
                  style={selectBase}
                >
                  {companyApprovalOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {isOther ? (
                <div style={{ gridColumn: 'span 6' as any }}>
                  {label('Other Expense Name')}
                  <input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter expense name"
                    style={inputBase}
                  />
                </div>
              ) : null}

              {companyApproval === 'expense_channel' ? (
                <div style={{ gridColumn: 'span 6' as any }}>
                  {label('Expense Channel')}
                  <input
                    value={expenseChannel}
                    onChange={(e) => setExpenseChannel(e.target.value)}
                    style={inputBase}
                    placeholder="Enter channel name"
                  />
                </div>
              ) : null}

              {companyApproval === 'referral_partner' ? (
                <div style={{ gridColumn: 'span 6' as any }}>
                  {label('Referral Partner')}
                  <input
                    value={referralPartner}
                    onChange={(e) => setReferralPartner(e.target.value)}
                    style={inputBase}
                    placeholder="Enter partner name"
                  />
                </div>
              ) : null}

              <div style={{ gridColumn: 'span 3' as any }}>
                {label('Amount To Be Pay')}
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  required
                  style={inputBase}
                  placeholder="₹0"
                />
              </div>

              {companyApproval === 'cashback_to_customer' ? (
                <div style={{ gridColumn: 'span 9' as any }}>
                  {label('Cashback')}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 12,
                      borderRadius: ui.radiusSm,
                      background: 'rgba(248,250,252,0.9)',
                      border: `1px dashed ${ui.border2}`,
                    }}
                  >
                    <input
                      id="cashback_to_customer"
                      type="checkbox"
                      checked={cashbackToCustomer}
                      onChange={(e) => setCashbackToCustomer(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <label
                      htmlFor="cashback_to_customer"
                      style={{ fontSize: 13, fontWeight: 900, color: ui.text }}
                    >
                      Cashback given to customer
                    </label>
                    <span style={{ fontSize: 12, color: ui.muted }}>(enable only when paid)</span>
                  </div>
                </div>
              ) : null}

              {/* Description */}
              <div style={{ gridColumn: 'span 8' as any }}>
                {label('Description')}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ ...inputBase, resize: 'vertical', minHeight: 92 }}
                  placeholder="Describe what this expense is for..."
                />
              </div>

              {/* Upload Invoices */}
              <div style={{ gridColumn: 'span 4' as any }}>
                {label('Upload Invoices')}
                <div
                  style={{
                    borderRadius: ui.radiusSm,
                    border: `1px dashed ${ui.border2}`,
                    padding: 12,
                    background: 'rgba(248,250,252,0.9)',
                  }}
                >
                  <input type="file" multiple onChange={(e) => setInvoices(Array.from(e.target.files || []))} />
                  <div style={{ fontSize: 11, color: ui.muted, marginTop: 8 }}>
                    {invoices.length ? `${invoices.length} file(s) selected` : 'PDF / Image upload – bills, receipts etc.'}
                  </div>
                </div>
              </div>

              {/* Payment Mode */}
              <div style={{ gridColumn: 'span 12' as any }}>
                {label('Payment Mode')}
                <div
                  style={{
                    padding: 12,
                    borderRadius: ui.radiusSm,
                    border: `1px solid ${ui.border}`,
                    background: 'rgba(255,255,255,0.75)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    style={{ ...selectBase, maxWidth: 300 }}
                  >
                    <option value="account">Bank Account Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="qr">QR Payment</option>
                  </select>

                </div>
              </div>

              {/* Account Fields */}
              {paymentMode === 'account' && (
                <>
                  <div style={{ gridColumn: 'span 3' as any }}>
                    {label('Account Holder Name')}
                    <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} style={inputBase} />
                  </div>

                  <div style={{ gridColumn: 'span 3' as any }}>
                    {label('Bank Name')}
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)} style={inputBase} />
                  </div>

                  <div style={{ gridColumn: 'span 3' as any }}>
                    {label('Account Number')}
                    <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputBase} />
                  </div>

                  <div style={{ gridColumn: 'span 3' as any }}>
                    {label('IFSC')}
                    <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} style={inputBase} />
                  </div>
                </>
              )}

              {/* UPI */}
              {paymentMode === 'upi' && (
                <div style={{ gridColumn: 'span 4' as any }}>
                  {label('UPI ID')}
                  <input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={inputBase}
                    placeholder="98xxxxxx@ybl"
                  />
                </div>
              )}

              {/* QR */}
              {paymentMode === 'qr' && (
                <div style={{ gridColumn: 'span 6' as any }}>
                  {label('Upload QR Image')}
                  <div
                    style={{
                      borderRadius: ui.radiusSm,
                      border: `1px dashed ${ui.border2}`,
                      padding: 12,
                      background: 'rgba(248,250,252,0.9)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setQrFile(file);
                      }}
                    />

                    {qrFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={URL.createObjectURL(qrFile)}
                          alt="QR Preview"
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            objectFit: 'cover',
                            border: `1px solid ${ui.border}`,
                            boxShadow: '0 8px 18px rgba(2,6,23,0.10)',
                          }}
                        />
                        <div style={{ fontSize: 12, fontWeight: 900, color: ui.text }}>{qrFile.name}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: ui.muted }}>Attach QR screenshot/logo for receiver.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setOpen(false);
                }}
                style={pillGhost}
              >
                Cancel
              </button>

              <button type="submit" disabled={saving} style={{ ...pillPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update Expense' : 'Submit Expense'}
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
                  ...(isAdmin ? (['Employee', 'Manager'] as const) : ([] as const)),
                  'Category',
                  'Amount To Pay',
                  'Description',
                  'Payment Details',
                  'Admin Status',
                  'Invoices',
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
                    width: 160,        // 🔥 pehle 110 tha
                    height: 160,       // 🔥 pehle 110 tha
                    borderRadius: 22,
                    objectFit: 'cover',
                    border: `1px solid ${ui.border2}`,
                    boxShadow: '0 14px 34px rgba(2,6,23,0.18)',
                    background: '#fff',
                    padding: 6,        // thoda premium frame feel
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

      {/* Pagination */}
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
