// =======================================
// ✅ ExpenseEmployee.tsx
// (STRICT EMP VIEW + FRONTEND SAFETY FILTER + PAYMENT DROPDOWN + QR UPLOAD + PAYMENT DIALOG + EDIT/DELETE)
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

// -------- shared UI styles ----------
const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#55657a',
};

const fieldInputStyle: React.CSSProperties = {
  padding: '9px 10px',
  borderRadius: 10,
  border: '1px solid #dde2eb',
  fontSize: 13,
  outline: 'none',
  background: '#fdfdfd',
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

// 🆕 Local API helpers for UPDATE + SOFT DELETE (multipart)
async function updateExpenseRequest(id: string, body: Record<string, any>, files: File[]) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};
  const companyId =
    (typeof window !== 'undefined' && (localStorage.getItem('company_id') || user.company_id)) ||
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
  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};
  const companyId =
    (typeof window !== 'undefined' && (localStorage.getItem('company_id') || user.company_id)) ||
    '';

  const res = await fetch(`${base}/expense-tracker/${encodeURIComponent(id)}/delete`, {
    method: 'Delete',
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

export default function ExpenseEmployee() {
  const defaultDate = useMemo(() => todayISO(), []);

  const employees = useSelector(
    (state: RootState) => (state as any)?.employees?.employees || [],
  ) as EmployeeType[];

  /**
   * ✅ LocalStorage user details (id + role)
   */
  const { myIds, roleNum, isAdmin } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { myIds: [] as string[], roleNum: 0, isAdmin: false };
    }

    const user: UserLS = JSON.parse(localStorage.getItem('user') || '{}');

    const ids = [user?.employee_id, user?._id, user?.id]
      .filter(Boolean)
      .map((x) => String(x).trim());

    const rRaw = user?.role ?? user?.role_id ?? user?.user_role ?? user?.employee_role ?? 0;
    const r = Number(rRaw) || 0;

    return { myIds: Array.from(new Set(ids)), roleNum: r, isAdmin: r === 1 };
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
      if (idOrObj?.first_name)
        return `${idOrObj.first_name} ${idOrObj.last_name || ''}`.trim();
      return _id || '-';
    }
    return empMap.get(String(idOrObj)) || String(idOrObj);
  };

  // ---------- form states ----------
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // 🆕 currently editing

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
  const [qrFile, setQrFile] = useState<File | null>(null); // 🆕 QR image

  // ---------- list states ----------
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  // 🆕 Payment details dialog state
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);

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
  };

  /**
   * ✅ STRICT ROLE-WISE LIST + FRONTEND SAFETY FILTER
   */
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
      setTotal(isAdmin ? (res?.total || 0) : safeRows.length);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAdmin, myIds.join('|')]);

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

    // 🧠 Build payment string from mode + fields
    let payment: string | undefined;

    if (paymentMode === 'account') {
      if (
        !accountHolder.trim() ||
        !bankName.trim() ||
        !accountNumber.trim() ||
        !ifsc.trim()
      ) {
        return alert(
          'Account Holder, Bank Name, Account Number & IFSC are required for Account payment',
        );
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
      // QR image alag se attach hoga (qrFile) – neeche invoices ke sath merge karenge
    }

    // 🧾 Invoices + QR file merge
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
      cashback_to_customer:
        companyApproval === 'cashback_to_customer' ? cashbackToCustomer : undefined,
      referral_partner: companyApproval === 'referral_partner' ? referralPartner : undefined,

      // 🧾 Text summary jo tum list me dikha rahe ho
      payment,

      // 🆕 Structured payment fields (yehi edit pe wapas aayenge)
      payment_mode: paymentMode, // 'account' | 'upi' | 'qr'

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
        // 🆕 UPDATE FLOW
        await updateExpenseRequest(editingId, payload, allFiles);
        alert('Expense updated ✅');
      } else {
        // CREATE FLOW
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

  const showCategory = (r: any) =>
    r?.company_admin === 'other' ? r?.custom_category || 'Other' : r?.company_admin;

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

  // 🆕 Load row into form for EDIT
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

    // Reset uploads (existing invoices server pe hi rahenge)
    setInvoices([]);
    setQrFile(null);

    // 🧠 Payment string se mode + fields parse karenge
    const p = String(r.payment || '').trim();

    // Defaults
    let mode: PaymentMode = 'account';
    let accHolder = '';
    let bank = '';
    let accNo = '';
    let ifscVal = '';
    let upi = '';
    let qrN = '';

    if (p.startsWith('Account Transfer')) {
      mode = 'account';

      // "Account Transfer | Name: X | Bank: Y | A/c: Z | IFSC: W"
      const parts = p.split('|').map((s) => s.trim());

      parts.forEach((part) => {
        if (part.startsWith('Name:')) {
          accHolder = part.replace('Name:', '').trim();
        } else if (part.startsWith('Bank:')) {
          bank = part.replace('Bank:', '').trim();
        } else if (part.startsWith('A/c:')) {
          accNo = part.replace('A/c:', '').trim();
        } else if (part.startsWith('IFSC:')) {
          ifscVal = part.replace('IFSC:', '').trim();
        }
      });
    } else if (p.startsWith('UPI')) {
      mode = 'upi';

      // "UPI | ID: something@upi"
      const parts = p.split('|').map((s) => s.trim());
      const idPart = parts.find((x) => x.startsWith('ID:'));
      if (idPart) {
        upi = idPart.replace('ID:', '').trim();
      }
    } else if (p.startsWith('QR Payment')) {
      mode = 'qr';

      // "QR Payment | Some note"
      const parts = p.split('|').map((s) => s.trim());
      if (parts.length > 1) {
        qrN = parts.slice(1).join(' | ');
      }
    }

    // 🔁 Ab state me set karo
    setPaymentMode(mode);
    setAccountHolder(accHolder);
    setBankName(bank);
    setAccountNumber(accNo);
    setIfsc(ifscVal);
    setUpiId(upi);
    setQrNote(qrN);
  };


  // 🆕 Delete (soft delete)
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

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 1100,
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
          marginBottom: 10,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>
          {isAdmin ? 'All Expenses' : 'My Expenses'}
        </h2>

        <button
          onClick={() => {
            if (open && editingId) {
              // Agar edit mode me tha aur close kara to reset bhi
              resetForm();
              setEditingId(null);
            }
            setOpen((v) => !v);
          }}
          style={{
            ...pillButtonPrimary,
            boxShadow: '0 8px 18px rgba(14, 116, 144, 0.3)',
            background: open
              ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
              : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          }}
        >
          {open ? (editingId ? 'Cancel Edit' : 'Close Form') : '+ Create Expense'}
        </button>
      </div>

      {/* CREATE / EDIT EXPENSE FORM */}
      {open && (
        <form
          onSubmit={onSubmit}
          style={{
            marginTop: 8,
            borderRadius: 18,
            background: '#ffffff',
            boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Card header strip */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #e5e7eb',
              background:
                'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
              {editingId ? 'Edit Expense' : 'New Expense Request'}
            </div>
          </div>

          <div style={{ padding: 16 }}>
            {/* Section 1: Basic Details */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: 12,
                }}
              >
                {/* Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Expense Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={fieldInputStyle}
                  />
                </div>

                {/* Expected Payment Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Expected Payment Date</label>
                  <input
                    type="date"
                    value={expectedPaymentDate}
                    onChange={(e) => setExpectedPaymentDate(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>

                {/* Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Expense Category</label>
                  <select
                    value={companyAdmin}
                    onChange={(e) => setCompanyAdmin(e.target.value as CompanyAdminValue)}
                    style={fieldInputStyle}
                  >
                    {companyAdminOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Category */}
                {isOther && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

            {/* Section 2: Expense Type & Amount */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: 12,
                }}
              >
                {/* Expense Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Expense Type</label>
                  <select
                    value={companyApproval}
                    onChange={(e) =>
                      setCompanyApproval(e.target.value as CompanyApprovalValue)
                    }
                    style={fieldInputStyle}
                  >
                    {companyApprovalOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional fields */}
                {companyApproval === 'expense_channel' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>Referral Partner</label>
                    <input
                      value={referralPartner}
                      onChange={(e) => setReferralPartner(e.target.value)}
                      style={fieldInputStyle}
                      placeholder="Enter partner name"
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: '#f9fafb',
                    border: '1px dashed #d1d5db',
                  }}
                >
                  <input
                    id="cashback_to_customer"
                    type="checkbox"
                    checked={cashbackToCustomer}
                    onChange={(e) => setCashbackToCustomer(e.target.checked)}
                  />
                  <label htmlFor="cashback_to_customer" style={{ fontSize: 12 }}>
                    Cashback given to customer
                  </label>
                </div>
              )}
            </div>

            {/* Section 3: Description & Invoices */}
            <div style={{ marginBottom: 4 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.1fr)',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{
                      ...fieldInputStyle,
                      resize: 'vertical',
                      minHeight: 72,
                    }}
                    placeholder="Describe what this expense is for..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={fieldLabelStyle}>Upload Invoices</label>
                  <div
                    style={{
                      borderRadius: 10,
                      border: '1px dashed #cbd5e1',
                      padding: 10,
                      background: '#f9fafb',
                    }}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setInvoices(Array.from(e.target.files || []))}
                    />
                    {invoices.length > 0 && (
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                        {invoices.length} file(s) selected
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                      PDF / Image upload karein – bills, receipts etc.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Payment Mode + QR Upload */}
            <div style={{ marginTop: 12 }}>
              <label style={fieldLabelStyle}>Payment Mode</label>

              {/* Row 1: dropdown */}
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '0 0 230px', maxWidth: 260 }}>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    style={fieldInputStyle}
                  >
                    <option value="account">Bank Account Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="qr">QR Payment</option>
                  </select>
                </div>
              </div>

              {/* ACCOUNT MODE */}
              {paymentMode === 'account' && (
                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>Account Holder Name</label>
                    <input
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      style={fieldInputStyle}
                      placeholder="Account holder name"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>Bank Name</label>
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      style={fieldInputStyle}
                      placeholder="HDFC, ICICI..."
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>Account Number</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      style={fieldInputStyle}
                      placeholder="1234 5678 9012"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>IFSC</label>
                    <input
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      style={fieldInputStyle}
                      placeholder="HDFC0001234"
                    />
                  </div>
                </div>
              )}

              {/* UPI MODE */}
              {paymentMode === 'upi' && (
                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>UPI ID</label>
                    <input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={fieldInputStyle}
                      placeholder="98xxxxxx@ybl"
                    />
                  </div>
                </div>
              )}

              {/* QR MODE */}
              {paymentMode === 'qr' && (
                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* QR Note */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>QR Note (optional)</label>
                    <input
                      value={qrNote}
                      onChange={(e) => setQrNote(e.target.value)}
                      style={fieldInputStyle}
                      placeholder="Example: Paid via Harpreet Ji QR"
                    />
                  </div>

                  {/* QR Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={fieldLabelStyle}>Upload QR Image</label>
                    <div
                      style={{
                        borderRadius: 10,
                        border: '1px dashed #cbd5e1',
                        padding: 10,
                        background: '#f9fafb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        maxWidth: 260,
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
                      {qrFile && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <img
                            src={URL.createObjectURL(qrFile)}
                            alt="QR Preview"
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: '1px solid #e5e7eb',
                            }}
                          />
                          <div style={{ fontSize: 11, color: '#4b5563' }}>{qrFile.name}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 12,
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setEditingId(null);
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
                {saving
                  ? editingId
                    ? 'Updating...'
                    : 'Saving...'
                  : editingId
                    ? 'Update Expense'
                    : 'Submit Expense'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* LIST */}
      <div style={{ marginTop: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          {/* yahan future filters aa sakte hain */}
        </div>

        <div
          style={{
            marginTop: 10,
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
                  ...(isAdmin ? (['Employee', 'Manager'] as const) : ([] as const)),
                  'Category',
                  'Paid',
                  'Payment Details',
                  'Mgr Status',
                  'Admin Status',
                  'Invoices',
                  'Action', // 🆕 always show Action column
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
                  const canVerify = isAdmin && r.admin_status === 'pending';
                  return (
                    <tr key={r._id}>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.date}
                      </td>

                      {isAdmin ? (
                        <>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: '1px solid #f1f1f1',
                              fontSize: 12,
                            }}
                          >
                            {getEmpName(r.owner_id)}
                          </td>
                          <td
                            style={{
                              padding: 10,
                              borderBottom: '1px solid #f1f1f1',
                              fontSize: 12,
                            }}
                          >
                            {getEmpName(r.manager_id)}
                          </td>
                        </>
                      ) : null}

                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                        }}
                      >
                        {showCategory(r)}
                      </td>

                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                        }}
                      >
                        {r.paid_amount}
                      </td>

                      {/* Payment Details column with dialog trigger */}
                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                          maxWidth: 260,
                        }}
                      >
                        {r.payment ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 180,
                              }}
                              title={r.payment}
                            >
                              {r.payment}
                            </span>

                            <button
                              type="button"
                              onClick={() => setPaymentPreview(r.payment)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid #d1d5db',
                                background: '#f9fafb',
                                fontSize: 11,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                        )}
                      </td>

                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                          textTransform: 'capitalize',
                        }}
                      >
                        {r.manager_status}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                          textTransform: 'capitalize',
                        }}
                      >
                        {r.admin_status}
                      </td>

                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1' }}>
                        {Array.isArray(r.invoices) && r.invoices.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {r.invoices.map((url: string, idx: number) => {
                              const name = prettyFileName(url);
                              const img = isImageUrl(url);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 10,
                                    padding: 8,
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'center',
                                    background: '#f9fafb',
                                    maxWidth: 420,
                                  }}
                                >
                                  {img ? (
                                    <img
                                      src={url}
                                      alt={name}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        objectFit: 'cover',
                                      }}
                                    />
                                  ) : null}

                                  <div style={{ minWidth: 0 }}>
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 12,
                                        color: '#1d4ed8',
                                        textDecoration: 'none',
                                      }}
                                    >
                                      {name || `Invoice ${idx + 1}`}
                                    </a>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: '#6b7280',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: 300,
                                      }}
                                    >
                                      {url}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>No invoice</span>
                        )}
                      </td>

                      {/* ACTION CELL */}
                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isAdmin ? (
                          <button
                            disabled={!canVerify}
                            onClick={() => setSelectedId(r._id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 999,
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: canVerify ? 'pointer' : 'not-allowed',
                              background: canVerify ? '#1d4ed8' : '#e5e7eb',
                              color: canVerify ? '#ffffff' : '#9ca3af',
                              boxShadow: canVerify
                                ? '0 3px 10px rgba(37, 99, 235, 0.35)'
                                : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            Verify
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(r)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid #93c5fd',
                                background: '#eff6ff',
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(r._id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                fontSize: 11,
                                cursor: 'pointer',
                                color: '#b91c1c',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {loadingList && (
                <tr>
                  <td colSpan={isAdmin ? 10 : 8} style={{ padding: 12, fontSize: 12 }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loadingList && rows.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 10 : 8} style={{ padding: 12, fontSize: 12 }}>
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ADMIN VERIFY BOX */}
        {isAdmin && selectedId && (
          <div
            style={{
              marginTop: 14,
              border: '1px solid #e5e7eb',
              padding: 12,
              borderRadius: 12,
              background: '#ffffff',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: 6, fontSize: 14 }}>
              Admin Verify Expense
            </h4>
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
              }}
              placeholder="Add a note for approval / rejection..."
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => verify(selectedId, 'approved')}
                style={{
                  ...pillButtonPrimary,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 8px 18px rgba(34, 197, 94, 0.3)',
                }}
              >
                Approve
              </button>
              <button
                onClick={() => verify(selectedId, 'rejected')}
                style={{
                  ...pillButtonPrimary,
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  boxShadow: '0 8px 18px rgba(239, 68, 68, 0.3)',
                }}
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setSelectedId('');
                  setNote('');
                }}
                style={pillButtonGhost}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT DETAILS DIALOG */}
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

              <div
                style={{
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  padding: '6px 0 4px',
                }}
              >
                {paymentPreview}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPaymentPreview(null)}
                  style={pillButtonPrimary}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
}
