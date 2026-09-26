'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { listExpenses, managerVerifyExpense } from './expenseApi';

type EmployeeType = {
  _id: string;
  first_name: string;
  last_name: string;
};

export default function ExpenseManager() {
  const employees = useSelector(
    (state: RootState) => (state as any)?.employees?.employees || [],
  ) as EmployeeType[];

  const empMap = useMemo(() => {
    const m = new Map<string, string>();
    (employees || []).forEach((e) => m.set(e._id, `${e.first_name} ${e.last_name}`));
    return m;
  }, [employees]);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  const totalPages = Math.max(1, Math.ceil((total || 0) / 10));

  async function load() {
    try {
      const res = await listExpenses({ page, limit: 10 }); // ✅ role-based filter backend
      setRows(res?.data || []);
      setTotal(res?.total || 0);
    } catch (e) {
      setRows([]);
      setTotal(0);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function verify(id: string, status: 'approved' | 'rejected') {
    try {
      await managerVerifyExpense(id, { status, note });
      setSelectedId('');
      setNote('');
      await load();
      alert('Manager verification done ✅');
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error');
    }
  }

  const getEmpName = (idOrObj: any) => {
    // if backend later sends populated object { _id, first_name... }
    if (!idOrObj) return '-';
    if (typeof idOrObj === 'object') {
      const _id = idOrObj?._id;
      if (_id && empMap.has(_id)) return empMap.get(_id);
      if (idOrObj?.first_name) return `${idOrObj.first_name} ${idOrObj.last_name || ''}`.trim();
      return _id || '-';
    }
    return empMap.get(String(idOrObj)) || String(idOrObj);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Manager - Verify Expenses</h2>

      <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Date', 'Employee', 'Category', 'Paid', 'Invoices', 'Status', 'Action'].map((h) => (
                <th key={h} style={{ borderBottom: '1px solid #ddd', padding: 10, textAlign: 'left', background: '#fafafa' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const canVerify = r.manager_status === 'pending';
              return (
                <tr key={r._id}>
                  <td style={{ borderBottom: '1px solid #f1f1f1', padding: 10 }}>{r.date}</td>
                  <td style={{ borderBottom: '1px solid #f1f1f1', padding: 10 }}>{getEmpName(r.owner_id)}</td>
                  <td style={{ borderBottom: '1px solid #f1f1f1', padding: 10 }}>
                    {r.company_admin === 'other' ? (r.custom_category || 'Other') : r.company_admin}
                  </td>
                  <td style={{ borderBottom: '1px solid #f1f1f1', padding: 10 }}>{r.paid_amount}</td>
                  <td style={{ borderBottom: '1px solid #f1f1f1', padding: 10 }}>
                    {(r.invoices || []).length ? (
                      (r.invoices || []).map((url: string, i: number) => (
                        <div key={i}>
                          <a href={url} target="_blank" rel="noreferrer">
                            Invoice {i + 1}
                          </a>
                        </div>
                      ))
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ borderBottom: '1px solid #f1f1f1', padding: 10 }}>{r.manager_status}</td>
                  <td style={{ borderBottom: '1px solid #f1f1f1', padding: 10 }}>
                    <button
                      disabled={!canVerify}
                      onClick={() => setSelectedId(r._id)}
                      style={{ cursor: canVerify ? 'pointer' : 'not-allowed' }}
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 12 }}>
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* verify box */}
      {selectedId && (
        <div style={{ marginTop: 14, border: '1px solid #ddd', padding: 12, borderRadius: 10 }}>
          <h4 style={{ marginTop: 0 }}>Verify Expense</h4>
          <textarea
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="note..."
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={() => verify(selectedId, 'approved')}>Approve</button>
            <button onClick={() => verify(selectedId, 'rejected')}>Reject</button>
            <button onClick={() => setSelectedId('')}>Cancel</button>
          </div>
        </div>
      )}

      {/* pagination */}
      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <span>
          Page <b>{page}</b> / <b>{totalPages}</b>
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          Next
        </button>
      </div>
    </div>
  );
}
