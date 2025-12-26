'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';

import { adminVerifyExpense, listExpenses } from './expenseApi';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

/** =========================
 *  ✅ Helpers (Invoices UI)
 *  ========================= */
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

/** =========================
 *  ✅ Types
 *  ========================= */
type TeamApi = {
  _id: string;
  name: string;
  code?: string;
};

const ALLOWED_TEAM_IDS: string[] = [];
const ALLOWED_TEAM_CODES: string[] = [];

type EmployeeType = {
  _id?: string;
  id?: string;
  first_name?: string;
  last_name?: string;
  image?: string;
  profile_pic?: string;
  code?: string;
  designation?: string;
};

type EmpInfo = {
  name: string;
  avatar?: string;
  code?: string;
  designation?: string;
};

type UserLS = {
  role?: number | string;
  role_id?: number | string;
  user_role?: number | string;
  employee_role?: number | string;
};

// 🔹 Status chip helper
const renderStatusChip = (status: string | undefined) => {
  const s = String(status || '').toLowerCase();

  let bg = '#e5e7eb';
  let color = '#374151';
  let label = status || '-';

  if (s === 'approved') {
    bg = 'rgba(16, 185, 129, 0.12)';
    color = '#047857';
    label = 'Approved';
  } else if (s === 'rejected') {
    bg = 'rgba(239, 68, 68, 0.12)';
    color = '#b91c1c';
    label = 'Rejected';
  } else if (s === 'pending') {
    bg = 'rgba(234, 179, 8, 0.12)';
    color = '#92400e';
    label = 'Pending';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color,
        textTransform: 'capitalize',
      }}
    >
      {label}
    </span>
  );
};

// 🔹 Shared button styles
const pillButtonPrimary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: '0 6px 16px rgba(37,99,235,0.35)',
};

const pillButtonGhost: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#4b5563',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export default function ExpenseAdmin() {
  const dispatch = useDispatch<AppDispatch>();

  /** ========= USER ROLE (ONLY ADMIN = 1) ========= */
  const { isAdmin, roleNum } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { isAdmin: false, roleNum: 0 };
    }

    const user: UserLS = JSON.parse(localStorage.getItem('user') || '{}');
    const rRaw = user?.role ?? user?.role_id ?? user?.user_role ?? user?.employee_role ?? 0;
    const r = Number(rRaw) || 0;

    // ✅ ADMIN = role 1
    const admin = r === 1;

    return { isAdmin: admin, roleNum: r };
  }, []);

  /** ========= Employees map ========= */
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
    const m = new Map<string, EmpInfo>();

    (employees || []).forEach((e) => {
      const key = String(e._id || (e as any).id || '').trim();
      if (!key) return;

      const fn = String(e.first_name || '').trim();
      const ln = String(e.last_name || '').trim();
      const name = `${fn} ${ln}`.trim() || 'Unknown';

      const avatar = e.image || e.profile_pic || undefined;

      m.set(key, {
        name,
        avatar,
        code: e.code,
        designation: e.designation,
      });
    });

    return m;
  }, [employees]);

  const getEmpInfo = (idOrObj: any): EmpInfo => {
    const empty: EmpInfo = {
      name: '-',
      avatar: undefined,
      code: undefined,
      designation: undefined,
    };

    if (!idOrObj) return empty;

    if (typeof idOrObj === 'object') {
      const _id = String(idOrObj?._id || idOrObj?.id || '').trim();

      if (_id && empMap.has(_id)) return empMap.get(_id)!;

      const fn = String(idOrObj?.first_name || '').trim();
      const ln = String(idOrObj?.last_name || '').trim();
      const name = `${fn} ${ln}`.trim() || _id || '-';

      const avatar = idOrObj.image || idOrObj.profile_pic || undefined;
      const code = idOrObj.code;
      const designation = idOrObj.designation;

      return { name, avatar, code, designation };
    }

    const id = String(idOrObj).trim();
    if (empMap.has(id)) return empMap.get(id)!;

    return {
      name: id || '-',
      avatar: undefined,
      code: undefined,
      designation: undefined,
    };
  };

  /** ========= Team state (Admin) ========= */
  const [teams, setTeams] = useState<TeamApi[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    if (!isAdmin) return; // non-admin ke liye teams bhi mat lao

    const run = async () => {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = localStorage.getItem('company_id') || user.company_id || '';

      try {
        setLoadingTeams(true);
        const res = await fetch(`${base}/teams/get-all-teams`, {
          headers: { Authorization: `Bearer ${token}`, 'x-company-id': companyId },
        });
        const data = await res.json();

        const list: TeamApi[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.teams)
          ? data.teams
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const hasAllowList = ALLOWED_TEAM_IDS.length > 0 || ALLOWED_TEAM_CODES.length > 0;

        const filteredList = hasAllowList
          ? list.filter((t) => {
              const id = String(t._id || '');
              const code = String(t.code || '').toUpperCase();
              const byId = ALLOWED_TEAM_IDS.includes(id);
              const byCode = ALLOWED_TEAM_CODES.map((x) => String(x).toUpperCase()).includes(
                code,
              );
              return byId || byCode;
            })
          : list;

        setTeams(filteredList);
        if (filteredList.length > 0) setSelectedTeamId(filteredList[0]._id);
        else setSelectedTeamId(null);
      } catch (e) {
        console.log('❌ get-all-teams error', e);
        setTeams([]);
        setSelectedTeamId(null);
      } finally {
        setLoadingTeams(false);
      }
    };
    run();
  }, [isAdmin]);

  /** ========= Expenses list state ========= */
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [loadingList, setLoadingList] = useState(false);

  const totalPages = Math.max(1, Math.ceil((total || 0) / 10));

  async function load() {
    if (!isAdmin) {
      setRows([]);
      setTotal(0);
      return;
    }

    try {
      setLoadingList(true);

      const res = await listExpenses({
        page,
        limit: 10,
        // future: team_id: selectedTeamId || undefined,
      });

      setRows(res?.data || []);
      setTotal(res?.total || 0);
    } catch (e) {
      setRows([]);
      setTotal(0);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAdmin]);

  async function verify(id: string, status: 'approved' | 'rejected') {
    try {
      if (!isAdmin) {
        alert('Only admin can verify (role 1 required)');
        return;
      }

      await adminVerifyExpense(id, { status, note });
      setSelectedId('');
      setNote('');
      await load();
      alert('Admin verification done ✅');
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Error');
    }
  }

  /** ========= NON-ADMIN VIEW ========= */
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
            Only users with <b>Admin (role = 1)</b> can view and verify expenses on this page.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
            Please login with an admin account if you need approval access.
          </p>
        </div>
      </div>
    );
  }

  /** ========= ADMIN VIEW ========= */
  return (
    <div
      style={{
        padding: 16,
        maxWidth: 1200,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#f3f5fb',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>
            Admin – Expense Approvals
          </h2>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            Logged in as <b>Admin</b> (role: {roleNum})
          </div>
        </div>

        <button
          onClick={load}
          disabled={loadingList}
          style={{
            ...pillButtonGhost,
            padding: '6px 12px',
            fontSize: 12,
            opacity: loadingList ? 0.7 : 1,
          }}
        >
          {loadingList ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ✅ Expenses Table */}
      <div
        style={{
          overflowX: 'auto',
          borderRadius: 16,
          background: '#ffffff',
          boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
          border: '1px solid #e5e7eb',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                'Date',
                'Employee',
                'Category',
                'Amount To Be Paid',
                'Mgr Status',
                'Admin Status',
                'Invoices',
                'Action',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    padding: 10,
                    textAlign: 'left',
                    background: '#f9fafb',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#4b5563',
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
                const canVerify = r.admin_status === 'pending';

                const empInfo = getEmpInfo(r.owner_id);

                return (
                  <tr key={r._id}>
                    {/* Date */}
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.date}
                    </td>

                    {/* Employee */}
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {empInfo.avatar ? (
                          <img
                            src={empInfo.avatar}
                            alt={empInfo.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #e5e7eb',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#4b5563',
                            }}
                          >
                            {empInfo.name?.[0] || 'E'}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {empInfo.name}
                          </span>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>
                            {empInfo.code || empInfo.designation || ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                      }}
                    >
                      {r.company_admin === 'other'
                        ? r.custom_category || 'Other'
                        : r.company_admin}
                    </td>

                    {/* Paid amount */}
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.paid_amount}
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                      }}
                    >
                      {renderStatusChip(r.manager_status)}
                    </td>
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                      }}
                    >
                      {renderStatusChip(r.admin_status)}
                    </td>

                    {/* Invoices */}
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                      }}
                    >
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

                    {/* Verify button */}
                    <td
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        padding: 10,
                        fontSize: 12,
                      }}
                    >
                      <button
                        disabled={!canVerify}
                        onClick={() => setSelectedId(r._id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 999,
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: canVerify ? 'pointer' : 'not-allowed',
                          background: canVerify ? '#1f7ae0' : '#cfd6e3',
                          color: canVerify ? '#ffffff' : '#6f7a8a',
                          boxShadow: canVerify
                            ? '0 4px 10px rgba(31,122,224,.25)'
                            : 'none',
                          transition: 'all .25s ease',
                        }}
                      >
                        ✓ Verify
                      </button>
                    </td>
                  </tr>
                );
              })}

            {loadingList && (
              <tr>
                <td colSpan={9} style={{ padding: 12, fontSize: 12 }}>
                  Loading...
                </td>
              </tr>
            )}

            {!loadingList && rows.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 12, fontSize: 12 }}>
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Admin Verify Box */}
      {selectedId && (
        <div
          style={{
            marginTop: 16,
            border: '1px solid #e5e7eb',
            padding: 14,
            borderRadius: 14,
            background: '#ffffff',
            maxWidth: 600,
            boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: 4, fontSize: 14, color: '#111827' }}>
            Admin Verify Expense
          </h4>
          <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
            Add a note for this approval / rejection (optional but recommended).
          </p>
          <textarea
            style={{
              width: '100%',
              padding: 10,
              marginTop: 8,
              borderRadius: 10,
              border: '1px solid #d1d5db',
              fontSize: 12,
              resize: 'vertical',
              minHeight: 70,
            }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Write a short note…"
          />
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 10,
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => verify(selectedId, 'approved')}
              style={{
                ...pillButtonPrimary,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 6px 14px rgba(34,197,94,0.35)',
              }}
            >
              Approve
            </button>
            <button
              onClick={() => verify(selectedId, 'rejected')}
              style={{
                ...pillButtonPrimary,
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                boxShadow: '0 6px 14px rgba(239,68,68,0.35)',
              }}
            >
              Reject
            </button>
            <button
              onClick={() => {
                setSelectedId('');
                setNote('');
              }}
              style={{
                ...pillButtonGhost,
                background: '#f9fafb',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          style={{
            ...pillButtonGhost,
            padding: '6px 12px',
            opacity: page <= 1 ? 0.6 : 1,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Prev
        </button>
        <span style={{ fontSize: 12 }}>
          Page <b>{page}</b> / <b>{totalPages}</b>
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          style={{
            ...pillButtonGhost,
            padding: '6px 12px',
            opacity: page >= totalPages ? 0.6 : 1,
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
