'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CreateReportDialog from './createdialog';

const statusColor = (s: string) =>
  s === 'Positive'
    ? { bg: '#dcfce7', border: '#22c55e', text: '#15803d' }
    : { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' };

const openColor = (v: boolean) =>
  v
    ? { bg: '#e8f0fe', border: '#1976d2', text: '#1565c0' }
    : { bg: '#f1f5f9', border: '#94a3b8', text: '#64748b' };

const ambienceIcon = (a: string) =>
  a === 'Good' ? '😊' : a === 'Average' ? '😐' : '😟';

const DEMO = [
  {
    _id: '1', doctorName: 'Dr. Priya Sharma', sfdcId: 'SFD-001', clinicName: 'Apollo Clinic',
    clinicAddress: '12, MG Road, Connaught Place, New Delhi - 110001',
    clinicType: 'Multispeciality Clinic', localityType: 'Commercial Zone',
    clinicOpenDuringVisit: true, clinicExistenceYears: 8, approxArea: 1200,
    furnishedStatus: 'Furnished', ambience: 'Good', ownership: 'Owned',
    visitingTiming: '9am – 2pm', patientsSeen: 45, visitingDays: ['Monday', 'Wednesday', 'Friday'],
    consultationFees: 700, finalStatus: 'Positive',
    remarks: 'Very cooperative doctor. Interested in our new product line.',
    visitingPersonName: 'Rahul Verma', employeeId: 'EMP-202', visitDate: '2024-06-10', visitTime: '10:30',
  },
  {
    _id: '2', doctorName: 'Dr. Anil Mehta', sfdcId: 'SFD-002', clinicName: 'Mehta Clinic',
    clinicAddress: '45, Nehru Nagar, Jaipur - 302001',
    clinicType: 'Individual Clinic', localityType: 'Residential Zone',
    clinicOpenDuringVisit: false, clinicExistenceYears: 3, approxArea: 400,
    furnishedStatus: 'Unfurnished', ambience: 'Average', ownership: 'Rented',
    visitingTiming: '6pm – 9pm', patientsSeen: 18, visitingDays: ['Tuesday', 'Thursday', 'Saturday'],
    consultationFees: 300, finalStatus: 'Negative',
    remarks: 'Not interested at the moment. Follow up in Q4.',
    visitingPersonName: 'Sneha Patel', employeeId: 'EMP-105', visitDate: '2024-06-11', visitTime: '18:00',
  },
  {
    _id: '3', doctorName: 'Dr. Kavita Rao', sfdcId: 'SFD-003', clinicName: 'LifeCare Hospital OPD',
    clinicAddress: '8, Ring Road, Bangalore - 560001',
    clinicType: 'Hospital OPD', localityType: 'Commercial Zone',
    clinicOpenDuringVisit: true, clinicExistenceYears: 15, approxArea: 3000,
    furnishedStatus: 'Furnished', ambience: 'Good', ownership: 'Owned',
    visitingTiming: '8am – 1pm', patientsSeen: 80, visitingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    consultationFees: 900, finalStatus: 'Positive',
    remarks: 'Agreed to trial. Schedule demo next week.',
    visitingPersonName: 'Arjun Singh', employeeId: 'EMP-310', visitDate: '2024-06-12', visitTime: '09:15',
  },
  {
    _id: '4', doctorName: 'Dr. Ritu Gupta', sfdcId: 'SFD-004', clinicName: 'Apollo Clinic',
    clinicAddress: 'Noida - 201301',
    clinicType: 'Individual Clinic', localityType: 'Residential Zone',
    clinicOpenDuringVisit: true, clinicExistenceYears: 2, approxArea: 350,
    furnishedStatus: 'Semi-Furnished', ambience: 'Average', ownership: 'Rented',
    visitingTiming: '10am – 1pm', patientsSeen: 20, visitingDays: ['Monday', 'Wednesday'],
    consultationFees: 999, finalStatus: 'Negative',
    remarks: 'Will revisit next month.',
    visitingPersonName: 'Amit Kumar', employeeId: 'EMP-411', visitDate: '2024-06-13', visitTime: '11:00',
  },
];

const DoctorVisitReportPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Positive' | 'Negative'>('All');
  const [selected, setSelected] = useState<any | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const getReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/visit-report/user-reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.log(err);
      setReports(DEMO);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getReports(); }, []);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.doctorName?.toLowerCase().includes(q) ||
      r.clinicName?.toLowerCase().includes(q) ||
      r.clinicAddress?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || r.finalStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const positive = reports.filter((r) => r.finalStatus === 'Positive').length;
  const negative = reports.filter((r) => r.finalStatus === 'Negative').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .vr-root {
          min-height: 100vh;
          background: #f0f4f8;
          background-image:
            radial-gradient(ellipse at 20% 0%, rgba(56,120,255,0.07) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 100%, rgba(0,180,140,0.05) 0%, transparent 60%);
          font-family: 'DM Sans', sans-serif;
          padding: 36px 24px 80px;
        }
        .vr-wrap { max-width: 1140px; margin: 0 auto; }

        /* hero */
        .vr-hero {
          background: linear-gradient(135deg, #1a2a6c 0%, #1565c0 55%, #0d47a1 100%);
          border-radius: 20px; padding: 32px 36px; margin-bottom: 28px;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 32px rgba(21,101,192,0.25);
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .vr-hero::before {
          content: ''; position: absolute; top: -50px; right: -50px;
          width: 220px; height: 220px; border-radius: 50%;
          background: rgba(255,255,255,0.06);
            pointer-events: none;

        }
        .vr-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22);
          border-radius: 20px; padding: 4px 12px;
          font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.9);
          letter-spacing: .08em; text-transform: uppercase; margin-bottom: 10px;
        }
        .vr-badge::before { content: '●'; font-size: 8px; color: #4cff91; }
        .vr-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; line-height: 1.2; }
        .vr-sub   { font-size: 13px; color: rgba(255,255,255,0.65); font-weight: 300; margin-top: 4px; }
        .vr-add-btn {
          flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px;
          background: #fff; color: #1565c0; border: none; border-radius: 12px;
          padding: 12px 22px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all .2s; box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .vr-add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }

        /* stats */
        .vr-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
        .vr-stat {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 20px 22px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          display: flex; align-items: center; gap: 14px;
        }
        .vr-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .vr-stat-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #1e293b; line-height: 1; }
        .vr-stat-lbl { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 500; }

        /* toolbar */
        .vr-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
        .vr-search {
          flex: 1; min-width: 220px; display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 10px 14px; transition: all .2s;
        }
        .vr-search:focus-within { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,.1); }
        .vr-search input {
          border: none; outline: none; background: transparent;
          font-size: 14px; color: #1e293b; font-family: 'DM Sans', sans-serif; width: 100%;
        }
        .vr-search input::placeholder { color: #c0ccd8; }
        .vr-search-icon { color: #94a3b8; font-size: 15px; flex-shrink: 0; }
        .vr-pills { display: flex; gap: 8px; }
        .vr-pill {
          padding: 8px 16px; border-radius: 8px; border: 1.5px solid #e2e8f0;
          background: #fff; font-size: 12px; font-weight: 600;
          font-family: 'Syne', sans-serif; cursor: pointer; transition: all .18s; color: #64748b;
        }
        .vr-pill.p-all { background: #e8f0fe; border-color: #1976d2; color: #1565c0; }
        .vr-pill.p-pos { background: #dcfce7; border-color: #22c55e; color: #15803d; }
        .vr-pill.p-neg { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }

        /* ═══════════════════════════════════════════════
           TABLE GRID  — the only rule that matters
           Both .vr-thead and .vr-trow share the SAME
           grid-template-columns. Each must have exactly
           7 direct-child <div>s — one per column.
           min-width:0 stops fr-cells from overflowing.
           ═══════════════════════════════════════════════ */
        .vr-card {
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          overflow: hidden;
           margin: 0 auto;
        }
        .vr-thead,
        .vr-trow {
          display: grid;
  grid-template-columns: 1.6fr 1.6fr 1.6fr 1.8fr 0.8fr 1fr 0.9fr;
          column-gap: 10px;
          padding: 0 20px;
          width: 100%;
        }
        /* every direct cell must not overflow its column */
        .vr-thead > div,
        .vr-trow  > div {
          min-width: 0;
          overflow: hidden;
        }
        .vr-thead {
          height: 42px; align-items: center;
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          font-size: 11px; font-weight: 600; color: #94a3b8;
          letter-spacing: .07em; text-transform: uppercase;
          font-family: 'Syne', sans-serif;
        }
        .vr-trow {
          min-height: 60px; align-items: center;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer; transition: background .15s;
        }
        .vr-trow:last-child { border-bottom: none; }
        .vr-trow:hover { background: #f8fafc; }

        /* cell text */
        .c-main {
          font-size: 14px; font-weight: 500; color: #1e293b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .c-sub {
          font-size: 12px; color: #94a3b8; margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .c-sec {
          font-size: 13px; color: #475569;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        /* address: allow 2 lines */
        .c-addr {
          font-size: 12px; color: #64748b; line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden; white-space: normal;
        }

        .vr-pill-badge {
          display: inline-flex; align-items: center;
          padding: 4px 10px; border-radius: 6px;
          border-width: 1px; border-style: solid;
          font-size: 11px; font-weight: 600;
          font-family: 'Syne', sans-serif; white-space: nowrap;
        }

        /* responsive */
        @media (max-width: 860px) {
          .vr-thead, .vr-trow { grid-template-columns: 1.8fr 1.8fr 1.2fr 80px 100px; }
          .col-hide { display: none !important; }
        }
        @media (max-width: 600px) {
          .vr-thead, .vr-trow { grid-template-columns: 1.6fr 1.2fr 90px; }
          .col-hide-sm { display: none !important; }
          .vr-stats { grid-template-columns: 1fr 1fr; }
          .vr-hero  { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 400px) { .vr-stats { grid-template-columns: 1fr; } }

        /* empty */
        .vr-empty { padding: 60px 20px; text-align: center; }
        .vr-empty-icon  { font-size: 48px; margin-bottom: 12px; }
        .vr-empty-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .vr-empty-sub   { font-size: 13px; color: #94a3b8; }

        /* loader */
        .vr-loader { padding: 48px; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .vr-dot { width: 8px; height: 8px; border-radius: 50%; background: #1976d2; animation: vrbounce .6s infinite alternate; }
        .vr-dot:nth-child(2) { animation-delay: .15s; }
        .vr-dot:nth-child(3) { animation-delay: .30s; }
        @keyframes vrbounce { from { transform: translateY(0) } to { transform: translateY(-10px) } }

        /* drawer */
        .vr-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.4);
          backdrop-filter: blur(4px); z-index: 100;
          display: flex; justify-content: flex-end;
        }
        .vr-drawer {
          width: 420px; max-width: 95vw; height: 100vh; overflow-y: auto;
          background: #fff; box-shadow: -8px 0 40px rgba(0,0,0,0.12);
          padding: 28px 28px 60px; animation: vrSlide .25s ease;
        }
        @keyframes vrSlide { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .vr-dhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .vr-dtitle { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #1e293b; }
        .vr-close {
          width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #e2e8f0;
          background: #f8fafc; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #64748b; transition: all .15s;
        }
        .vr-close:hover { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }
        .vr-dsec { margin-bottom: 20px; }
        .vr-dsec-title {
          font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
          color: #94a3b8; letter-spacing: .08em; text-transform: uppercase;
          margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;
        }
        .vr-dgrid  { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .vr-dfield { display: flex; flex-direction: column; gap: 3px; }
        .vr-dlabel { font-size: 11px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; }
        .vr-dvalue { font-size: 14px; color: #1e293b; font-weight: 500; }
        .vr-dtext  { font-size: 13px; color: #475569; line-height: 1.5; }
        .vr-days   { display: flex; flex-wrap: wrap; gap: 6px; }
        .vr-day    { padding: 4px 10px; background: #e8f0fe; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 12px; font-weight: 600; color: #1565c0; font-family: 'Syne', sans-serif; }
      `}</style>

      <div className="vr-root">
        <div className="vr-wrap">

          {/* Hero */}
          <div className="vr-hero">
            <div>
              <div className="vr-badge">Sales Force · Field Reports</div>
              <div className="vr-title">Visit Reports Dashboard</div>
              <div className="vr-sub">Track and manage all clinic visit reports from your team.</div>
            </div>
            <button className="vr-add-btn" onClick={() => setOpenCreate(true)}>
              ＋ New Report
            </button>
          </div>

          {/* Stats */}
          <div className="vr-stats">
            <div className="vr-stat">
              <div className="vr-stat-icon" style={{ background: '#e8f0fe' }}>📋</div>
              <div><div className="vr-stat-num">{reports.length}</div><div className="vr-stat-lbl">Total Reports</div></div>
            </div>
            <div className="vr-stat">
              <div className="vr-stat-icon" style={{ background: '#dcfce7' }}>✅</div>
              <div><div className="vr-stat-num" style={{ color: '#15803d' }}>{positive}</div><div className="vr-stat-lbl">Positive Visits</div></div>
            </div>
            <div className="vr-stat">
              <div className="vr-stat-icon" style={{ background: '#fee2e2' }}>❌</div>
              <div><div className="vr-stat-num" style={{ color: '#b91c1c' }}>{negative}</div><div className="vr-stat-lbl">Negative Visits</div></div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="vr-toolbar">
            <div className="vr-search">
              <span className="vr-search-icon">🔍</span>
              <input
                placeholder="Search by doctor, clinic, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="vr-pills">
              <button className={`vr-pill${filterStatus === 'All' ? ' p-all' : ''}`} onClick={() => setFilterStatus('All')}>📋 All</button>
              <button className={`vr-pill${filterStatus === 'Positive' ? ' p-pos' : ''}`} onClick={() => setFilterStatus('Positive')}>✅ Positive</button>
              <button className={`vr-pill${filterStatus === 'Negative' ? ' p-neg' : ''}`} onClick={() => setFilterStatus('Negative')}>❌ Negative</button>
            </div>
          </div>

          <div className="vr-card">
            <div className="vr-thead">
              {/* <div>Created By</div> */}
              <div>Doctor/Clinic</div>
              <div>Mob/Spec</div>
              <div>Specialization</div>
              {/* <div>Specialization</div> */}
              <div>Address</div>
              {/* <div>Type</div> */}
              {/* <div className="col-hide">Pts</div> */}
              <div className="col-hide">Fees</div>
              {/* <div>clinicType</div> */}

              <div>Status</div>
              <div>Action</div>

            </div>

            {loading ? (
              <div className="vr-loader">
                <div className="vr-dot" /><div className="vr-dot" /><div className="vr-dot" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="vr-empty">
                <div className="vr-empty-icon">🗂️</div>
                <div className="vr-empty-title">No reports found</div>
                <div className="vr-empty-sub">Try adjusting your search or filters.</div>
              </div>
            ) : (
              filtered.map((r) => {
                const sc = statusColor(r.finalStatus);
                const oc = openColor(r.clinicOpenDuringVisit);
                return (

                  <div className="vr-trow" key={r._id} onClick={() => setSelected(r)}>

                    {/* <div>
                      <div className="c-main">{r.employeeName}</div>
                    </div> */}
                    <div>
                      <div className="c-main">{r.doctorName}</div>
                      <div className="c-sub">{r.clinicName}</div>
                    </div>
                    <div>
                      <div className="c-main">{r.doctorMobile}</div>

                    </div>
                    <div className="c-sub">{r.doctorSpecialization}</div>
                    {/* col 2 — Address (2-line clamp) */}
                    <div className="c-addr">{r.clinicAddress || '—'}</div>

                    {/* col 3 — Clinic type */}


                    {/* col 4 — Patients */}
                    {/* <div className="c-sec col-hide">{r.patientsSeen ?? '—'}</div> */}

                    {/* col 5 — Fees */}
                    <div className="c-sec col-hide">
                      {r.consultationFees ? `₹${r.consultationFees}` : '—'}
                    </div>

                    {/* <div>
                      <span className="vr-pill-badge" style={{ background: '#f1f5f9', borderColor: '#e2e8f0', color: '#475569' }}>
                        {r.clinicType?.split(' ')[0] || '—'}
                      </span>
                    </div> */}
                    <div>
                      <span className="vr-pill-badge" style={{ background: sc.bg, borderColor: sc.border, color: sc.text }}>
                        {r.finalStatus}
                      </span>
                    </div>


                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span
                        title="View"
                        style={{ cursor: 'pointer', fontSize: 16 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(r);
                        }}
                      >
                        👁️
                      </span>
                      <span
                        title="Edit"
                        style={{ cursor: 'pointer', fontSize: 16 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTarget(r);
                          setOpenCreate(true);
                        }}
                      >
                        ✏️
                      </span>
                    </div>



                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
            Showing {filtered.length} of {reports.length} reports
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="vr-overlay" onClick={() => setSelected(null)}>
          <div className="vr-drawer" onClick={(e) => e.stopPropagation()}>

            <div className="vr-dhead">
              <div className="vr-dtitle">Report Details</div>
              <button
                className="vr-close"
                style={{ marginLeft: "70px" }}

                title="Edit Report"
                onClick={() => {
                  setEditTarget(selected);
                  setSelected(null);
                  setOpenCreate(true);
                }}
              >
                ✏️
              </button>
              <button className="vr-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              {(() => {
                const sc = statusColor(selected.finalStatus);
                return (
                  <span className="vr-pill-badge" style={{ background: sc.bg, borderColor: sc.border, color: sc.text, fontSize: 13, padding: '6px 14px' }}>
                    {selected.finalStatus === 'Positive' ? '✅' : '❌'} {selected.finalStatus}
                  </span>
                );
              })()}
            </div>

            <div className="vr-dsec">
              <div className="vr-dsec-title">🏥 Doctor &amp; Clinic</div>
              <div className="vr-dgrid">
                <div className="vr-dfield"><div className="vr-dlabel">Doctor</div><div className="vr-dvalue">{selected.doctorName}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Mobile</div><div className="vr-dvalue">{selected.doctorMobile}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Specialization</div><div className="vr-dvalue">{selected.doctorSpecialization}</div></div>

                <div className="vr-dfield"><div className="vr-dlabel">SFDC ID</div><div className="vr-dvalue">{selected.sfdcId || '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Clinic</div><div className="vr-dvalue">{selected.clinicName}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Type</div><div className="vr-dvalue">{selected.clinicType || '—'}</div></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="vr-dlabel">Address</div>
                <div className="vr-dtext">{selected.clinicAddress || '—'}</div>
              </div>
            </div>

            <div className="vr-dsec">
              <div className="vr-dsec-title">🔍 Clinic Details</div>
              <div className="vr-dgrid">
                <div className="vr-dfield"><div className="vr-dlabel">Locality</div><div className="vr-dvalue">{selected.localityType || '—'}</div></div>
                <div className="vr-dfield">
                  <div className="vr-dlabel">Open During Visit</div>
                  <div className="vr-dvalue">{selected.clinicOpenDuringVisit ? '✅ Yes' : '❌ No'}</div>
                </div>
                <div className="vr-dfield"><div className="vr-dlabel">Existence</div><div className="vr-dvalue">{selected.clinicExistenceYears ? `${selected.clinicExistenceYears} yrs` : '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Approx Area</div><div className="vr-dvalue">{selected.approxArea ? `${selected.approxArea} sq ft` : '—'}</div></div>
              </div>
            </div>

            <div className="vr-dsec">
              <div className="vr-dsec-title">🏗️ Setup &amp; Ownership</div>
              <div className="vr-dgrid">
                <div className="vr-dfield"><div className="vr-dlabel">Furnished</div><div className="vr-dvalue">{selected.furnishedStatus || '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Ownership</div><div className="vr-dvalue">{selected.ownership || '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Ambience</div><div className="vr-dvalue">{selected.ambience ? `${ambienceIcon(selected.ambience)} ${selected.ambience}` : '—'}</div></div>
              </div>
            </div>

            <div className="vr-dsec">
              <div className="vr-dsec-title">📅 Visit Info</div>
              <div className="vr-dgrid">
                <div className="vr-dfield"><div className="vr-dlabel">Timing</div><div className="vr-dvalue">{selected.visitingTiming || '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Patients Seen</div><div className="vr-dvalue">{selected.patientsSeen ?? '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Consult Fees</div><div className="vr-dvalue">{selected.consultationFees ? `₹${selected.consultationFees}` : '—'}</div></div>
              </div>
              {selected.visitingDays?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="vr-dlabel" style={{ marginBottom: 6 }}>Visiting Days</div>
                  <div className="vr-days">
                    {selected.visitingDays.map((d: string) => (
                      <span className="vr-day" key={d}>{d.slice(0, 3)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selected.remarks && (
              <div className="vr-dsec">
                <div className="vr-dsec-title">💬 Remarks</div>
                <div className="vr-dtext">{selected.remarks}</div>
              </div>
            )}

            <div className="vr-dsec">
              <div className="vr-dsec-title">👤 Visiting Person</div>
              <div className="vr-dgrid">
                <div className="vr-dfield"><div className="vr-dlabel">Name</div><div className="vr-dvalue">{selected.visitingPersonName || '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Employee ID</div><div className="vr-dvalue">{selected.employeeId || '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Date</div><div className="vr-dvalue">{selected.visitDate || '—'}</div></div>
                <div className="vr-dfield"><div className="vr-dlabel">Time</div><div className="vr-dvalue">{selected.visitTime || '—'}</div></div>
              </div>
            </div>

          </div>
        </div>
      )}
      <CreateReportDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        refresh={getReports}
        editData={editTarget}
      />
    </>
  );
};

export default DoctorVisitReportPage;
