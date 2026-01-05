'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';
import { Snackbar, Alert } from '@mui/material';

import {
  createExpense,
  listExpenses,
  todayISO,
  adminVerifyExpense,
  updateExpense,
  softDeleteExpense,
} from './expenseApi';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

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

// -------- options (SAME as ExpenseEmployee) ----------
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
  _id?: string;
  id?: string;
  role?: number | string;
  role_id?: number | string;
  user_role?: number | string;
  employee_role?: number | string;
};

// 🆕 payment mode type
type PaymentMode = 'account' | 'upi' | 'qr';

// -------- shared UI styles (SAME) ----------
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

export default function ExpenseAdmin() {
  const dispatch = useDispatch<AppDispatch>();

  const defaultDate = useMemo(() => todayISO(), []);

  // 🆕 Snackbar state
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('success');

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'success',
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  // ===== USER (ADMIN CHECK) =====
  const { isAdmin } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isAdmin: false };
    }
    const user: UserLS = JSON.parse(localStorage.getItem('user') || '{}');
    const rRaw =
      user?.role ?? user?.role_id ?? user?.user_role ?? user?.employee_role ?? 0;
    const r = Number(rRaw) || 0;
    return { isAdmin: r === 1 };
  }, []);

  // ===== EMPLOYEES for name mapping =====
  const employees = useSelector(
    (state: RootState) => (state as any)?.employees?.employees || [],
  ) as EmployeeType[];

  useEffect(() => {
    if (!employees || employees.length === 0) {
      dispatch(fetchEmployees());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ---------- CREATE / EDIT FORM STATES ----------
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🆕 track which expense is being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState(defaultDate);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState<string>('');

  const [companyAdmin, setCompanyAdmin] = useState<CompanyAdminValue>('cake');
  const [customCategory, setCustomCategory] = useState('');

  const [companyApproval, setCompanyApproval] =
    useState<CompanyApprovalValue>('company_approval');

  const [paidAmount, setPaidAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [invoices, setInvoices] = useState<File[]>([]);

  const [managerId] = useState<string>(''); // optional backend field

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
    setEditingId(null); // 🆕 reset edit mode
  };

  // ---------- LIST STATES ----------
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  const totalPages = Math.max(1, Math.ceil((total || 0) / 10));

  // admin verify
  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [verifyingId, setVerifyingId] = useState<string>(''); // 🆕 verify loading state

  // payment preview dialog
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);

  const showCategory = (r: any) =>
    r?.company_admin === 'other' ? r?.custom_category || 'Other' : r?.company_admin;

  // ---------- LOAD LIST (ADMIN = all) ----------
  const load = async () => {
    try {
      setLoadingList(true);
      if (!isAdmin) {
        setRows([]);
        setTotal(0);
        return;
      }

      const res = await listExpenses({
        page,
        limit: 10,
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
  }, [page, isAdmin]);

  // ---------- ADMIN VERIFY ----------
  async function verify(id: string, status: 'approved' | 'rejected') {
    try {
      if (!isAdmin) return;

      setVerifyingId(id);

      await adminVerifyExpense(id, { status, note });

      setSelectedId('');
      setNote('');
      await load();

      const msg =
        status === 'approved'
          ? 'Expense approved successfully'
          : 'Expense rejected successfully';

      const severity = status === 'approved' ? 'success' : 'error';

      showSnackbar(msg, severity);
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message || err?.message || 'Error while verifying',
        'error',
      );
    } finally {
      setVerifyingId('');
    }
  }

  // ---------- START EDIT ----------
  const startEdit = (row: any) => {
    setOpen(true);
    setEditingId(row._id || null);

    // Basic fields
    setDate(row.date?.slice(0, 10) || defaultDate);
    setExpectedPaymentDate(
      row.expected_payment_date ? String(row.expected_payment_date).slice(0, 10) : '',
    );

    setCompanyAdmin((row.company_admin as CompanyAdminValue) || 'cake');
    setCustomCategory(row.custom_category || '');
    setCompanyApproval(
      (row.company_approval as CompanyApprovalValue) || 'company_approval',
    );

    setPaidAmount(row.paid_amount != null ? String(row.paid_amount) : '');
    setDescription(row.description || '');

    setExpenseChannel(row.expense_channel || '');
    setCashbackToCustomer(!!row.cashback_to_customer);
    setReferralPartner(row.referral_partner || '');

    // 🆕 PAYMENT DETAILS FROM row.payment
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
      // unknown / empty -> default
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

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      showSnackbar(
        err?.response?.data?.message || err?.message || 'Error while deleting expense',
        'error',
      );
    }
  };

  // ---------- SUBMIT CREATE / UPDATE ----------
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔴 VALIDATIONS via Snackbar
    if (!date) {
      showSnackbar('Submission date required', 'error');
      return;
    }
    if (!companyAdmin) {
      showSnackbar('Company Admin required', 'error');
      return;
    }
    if (isOther && !customCategory.trim()) {
      showSnackbar('Please enter Other expense name', 'error');
      return;
    }
    if (!companyApproval) {
      showSnackbar('More Expense Type required', 'error');
      return;
    }
    if (!paidAmount.trim()) {
      showSnackbar('Paid amount required', 'error');
      return;
    }

    const amt = Number(paidAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      showSnackbar('Paid amount must be valid number', 'error');
      return;
    }

    if (companyApproval === 'expense_channel' && !expenseChannel.trim()) {
      showSnackbar('Expense Channel required', 'error');
      return;
    }
    if (companyApproval === 'referral_partner' && !referralPartner.trim()) {
      showSnackbar('Referral Partner required', 'error');
      return;
    }

    // Payment string build
    let payment: string | undefined;

    if (paymentMode === 'account') {
      if (
        !accountHolder.trim() ||
        !bankName.trim() ||
        !accountNumber.trim() ||
        !ifsc.trim()
      ) {
        showSnackbar(
          'Account Holder, Bank Name, Account Number & IFSC are required for Account payment',
          'error',
        );
        return;
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
      if (!upiId.trim()) {
        showSnackbar('UPI ID is required', 'error');
        return;
      }
      payment = `UPI | ID: ${upiId.trim()}`;
    } else if (paymentMode === 'qr') {
      payment = `QR Payment${qrNote.trim() ? ' | ' + qrNote.trim() : ''}`;
      // QR file alag se invoices me add hoga
    }

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
      expense_channel:
        companyApproval === 'expense_channel' ? expenseChannel : undefined,
      cashback_to_customer:
        companyApproval === 'cashback_to_customer' ? cashbackToCustomer : undefined,
      referral_partner:
        companyApproval === 'referral_partner' ? referralPartner : undefined,
      payment,

      // 🆕 structured fields
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
        // 🆕 UPDATE
        await updateExpense(editingId, payload, allFiles);
        showSnackbar('Expense updated successfully ✅', 'success');
      } else {
        // CREATE
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

  // ========= NON ADMIN VIEW =========
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
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, color: '#111827' }}>
            Access Restricted
          </h3>
          <p style={{ margin: 0, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
            Only users with <b>Admin (role = 1)</b> can view and manage expenses on this
            page.
          </p>
        </div>
      </div>
    );
  }

  // ========= ADMIN VIEW =========
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
        <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Company Expenses</h2>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => {
              if (open) {
                resetForm();
              } else {
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
              padding: '6px 14px',
              fontSize: 12,
            }}
          >
            {open ? 'Close Form' : '+ Create Expense'}
          </button>
        </div>
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
              {editingId ? 'Edit Company Expense' : 'Create Company Expense'}
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
                    id="cashback_to_customer_admin"
                    type="checkbox"
                    checked={cashbackToCustomer}
                    onChange={(e) => setCashbackToCustomer(e.target.checked)}
                  />
                  <label htmlFor="cashback_to_customer_admin" style={{ fontSize: 12 }}>
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

              {/* dropdown */}
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
                              width: 40, // 🧾 smaller preview
                              height: 40,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: '1px solid #e5e7eb',
                            }}
                          />
                          <div style={{ fontSize: 11, color: '#4b5563' }}>
                            {qrFile.name}
                          </div>
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
                  ? 'Saving...'
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
            marginTop: 40,
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
                  'Employee',
                  'Manager',
                  'Category',
                  'Paid',
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
                  // Edit/Delete sirf pending pe
                  const canEdit = r.admin_status === 'pending';
                  const canDelete = r.admin_status === 'pending';

                  // sirf yeh row abhi verify ho rahi hai?
                  const isRowVerifying = verifyingId === r._id;

                  // ✅ admin ho to hamesha status change allowed
                  const canVerify = isAdmin;

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
                        {r.date?.slice(0, 10)}
                      </td>

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

                      {/* Payment Details */}
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
                        {r.admin_status}
                      </td>

                      {/* 🧾 INVOICES (SMALL THUMBNAIL + CLICK TO OPEN) */}
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1' }}>
                        {Array.isArray(r.invoices) && r.invoices.length > 0 ? (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 8,
                            }}
                          >
                            {r.invoices.map((url: string, idx: number) => {
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
                                      style={{
                                        width: 26, // 🧾 smaller image
                                        height: 26,
                                        borderRadius: 6,
                                        objectFit: 'cover',
                                      }}
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
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            No invoice
                          </span>
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
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => startEdit(r)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: canEdit ? 'pointer' : 'not-allowed',
                              background: canEdit ? '#0ea5e9' : '#e5e7eb',
                              color: canEdit ? '#ffffff' : '#9ca3af',
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={!canDelete}
                            onClick={() => handleDelete(r._id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: canDelete ? 'pointer' : 'not-allowed',
                              background: canDelete ? '#ef4444' : '#e5e7eb',
                              color: canDelete ? '#ffffff' : '#9ca3af',
                            }}
                          >
                            Del
                          </button>

                          <button
                            type="button"
                            disabled={!canVerify || isRowVerifying}
                            onClick={() => {
                              if (!canVerify || isRowVerifying) return;
                              setSelectedId(r._id);
                              setNote(''); // har baar fresh note
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor:
                                !canVerify || isRowVerifying ? 'not-allowed' : 'pointer',
                              background:
                                canVerify && !isRowVerifying ? '#1d4ed8' : '#e5e7eb',
                              color:
                                canVerify && !isRowVerifying ? '#ffffff' : '#9ca3af',
                              boxShadow:
                                canVerify && !isRowVerifying
                                  ? '0 3px 10px rgba(37, 99, 235, 0.35)'
                                  : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {r.admin_status === 'pending'
                              ? isRowVerifying
                                ? 'Verifying...'
                                : 'Verify'
                              : isRowVerifying
                                ? 'Updating...'
                                : 'Change Status'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {loadingList && (
                <tr>
                  <td colSpan={10} style={{ padding: 12, fontSize: 12 }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loadingList && rows.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: 12, fontSize: 12 }}>
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ ADMIN VERIFY DIALOG */}
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
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Admin Verify Expense
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId('');
                    setNote('');
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

              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                Please add a note and choose <b>Approve</b> or <b>Reject</b> for this
                expense.
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
                placeholder="Add a note for approval / rejection..."
              />

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 12,
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  disabled={verifyingId === selectedId}
                  onClick={() => verify(selectedId, 'approved')}
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
                  disabled={verifyingId === selectedId}
                  onClick={() => verify(selectedId, 'rejected')}
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
                    setNote('');
                  }}
                  style={pillButtonGhost}
                >
                  Cancel
                </button>
              </div>
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

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
