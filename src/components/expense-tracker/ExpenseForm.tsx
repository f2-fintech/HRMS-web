'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type Option = { label: string; value: string };

// backend base
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
const EXPENSES_API_URL = `${API_BASE_URL}/expenses`;

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
};

const pillButtonGhost: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid #dde2eb',
  background: '#f8fafc',
  color: '#4b5563',
  fontSize: 13,
  cursor: 'pointer',
};

export default function ExpenseSinglePage() {
  // departments
  const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  // form states
  const [department, setDepartment] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [date, setDate] = useState('');
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');

  const [companyAdmin, setCompanyAdmin] = useState('other');
  const [customCategory, setCustomCategory] = useState('');

  const [companyApproval, setCompanyApproval] = useState('company_approval');

  const [paidAmount, setPaidAmount] = useState('');
  const [description, setDescription] = useState('');

  const [invoices, setInvoices] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  // dropdown options (match backend enums)
  const companyAdminOptions = useMemo<Option[]>(
    () => [
      { label: 'Cake', value: 'cake' },
      { label: 'Stationary', value: 'stationary' },
      { label: 'Water', value: 'water' },
      { label: 'Tea', value: 'tea' },
      { label: 'Internet', value: 'internet' },
      { label: 'Electricity', value: 'electricity' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Bonus', value: 'bonus' },
      { label: 'Incentives', value: 'incentives' },
      { label: 'Other', value: 'other' },
    ],
    []
  );

  const companyApprovalOptions = useMemo<Option[]>(
    () => [
      { label: 'Company Approval', value: 'company_approval' },
      { label: 'Expense Channel', value: 'expense_channel' },
      { label: 'Payment Partners', value: 'payment_partners' },
      { label: 'Payout', value: 'payout' },
      { label: 'Cashback To Customer', value: 'cashback_to_customer' },
      { label: 'Referral Partner', value: 'referral_partner' },
      { label: 'Payment', value: 'payment' },
      { label: 'Data Purchase', value: 'data_purchase' },
    ],
    []
  );

  // fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token') || '';
        const cid = localStorage.getItem('company_id') || '';

        const res = await fetch(`${API_BASE_URL}/teams/get-all-teams`, {
          headers: {
            Authorization: `Bearer ${token} ${cid}`,
          },
        });

        const json = await res.json();
        const teams = Array.isArray(json) ? json : json.teams || [];

        const opts = teams.map((t: any) => ({
          label: t.name,
          value: t._id,
        }));

        setDepartmentOptions(opts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const resetForm = () => {
    setDepartment('');
    setInvoiceDate('');
    setDate('');
    setExpectedPaymentDate('');
    setCompanyAdmin('other');
    setCustomCategory('');
    setCompanyApproval('company_approval');
    setPaidAmount('');
    setDescription('');
    setInvoices([]);
  };

  // submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const token = localStorage.getItem('token') || '';
      const cid = localStorage.getItem('company_id') || '';

      const fd = new FormData();

      // 🔑 EXACT backend keys
      fd.append('department', department);
      if (invoiceDate) fd.append('invoice_date', invoiceDate);

      fd.append('date', date);
      if (expectedPaymentDate)
        fd.append('expected_payment_date', expectedPaymentDate);

      fd.append('company_admin', companyAdmin);
      if (customCategory) fd.append('custom_category', customCategory);

      fd.append('company_approval', companyApproval);

      fd.append('paid_amount', paidAmount);
      if (description) fd.append('description', description);

      invoices.forEach((f) => fd.append('invoices', f));

      fd.append('company_id', cid);

      await axios.post(`${EXPENSES_API_URL}/create`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('✅ Expense saved successfully');
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || '❌ Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 900, margin: 'auto' }}>
      <h3>Create Expense</h3>

      {/* Department */}
      <label style={fieldLabelStyle}>Department</label>
      <select
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        style={fieldInputStyle}
        required
      >
        <option value="">Select</option>
        {departmentOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Invoice date */}
      <label style={fieldLabelStyle}>Invoice Date</label>
      <input
        type="date"
        value={invoiceDate}
        onChange={(e) => setInvoiceDate(e.target.value)}
        style={fieldInputStyle}
      />

      {/* Expense date */}
      <label style={fieldLabelStyle}>Expense Date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={fieldInputStyle}
        required
      />

      {/* Expected date */}
      <label style={fieldLabelStyle}>Expected Payment Date</label>
      <input
        type="date"
        value={expectedPaymentDate}
        onChange={(e) => setExpectedPaymentDate(e.target.value)}
        style={fieldInputStyle}
      />

      {/* Category */}
      <label style={fieldLabelStyle}>Expense Category</label>
      <select
        value={companyAdmin}
        onChange={(e) => setCompanyAdmin(e.target.value)}
        style={fieldInputStyle}
      >
        {companyAdminOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {companyAdmin === 'other' && (
        <>
          <label style={fieldLabelStyle}>Custom Category</label>
          <input
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            style={fieldInputStyle}
          />
        </>
      )}

      {/* Approval */}
      <label style={fieldLabelStyle}>Approval Type</label>
      <select
        value={companyApproval}
        onChange={(e) => setCompanyApproval(e.target.value)}
        style={fieldInputStyle}
      >
        {companyApprovalOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Amount */}
      <label style={fieldLabelStyle}>Amount</label>
      <input
        type="number"
        value={paidAmount}
        onChange={(e) => setPaidAmount(e.target.value)}
        style={fieldInputStyle}
        required
      />

      {/* Description */}
      <label style={fieldLabelStyle}>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={fieldInputStyle}
      />

      {/* Invoice */}
      <label style={fieldLabelStyle}>Upload Invoice</label>
      <input
        type="file"
        multiple
        onChange={(e) => setInvoices(Array.from(e.target.files || []))}
      />

      <div style={{ marginTop: 15 }}>
        <button type="button" onClick={resetForm} style={pillButtonGhost}>
          Reset
        </button>

        <button
          type="submit"
          disabled={saving}
          style={{ ...pillButtonPrimary, marginLeft: 10 }}
        >
          {saving ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
