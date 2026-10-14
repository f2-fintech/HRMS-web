'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'

/**
 * AttendanceActivityDashboard
 * ----------------------------------------------------------------------
 * Admin-facing page: shows ALL employees' punch activity, switchable
 * between DAILY and MONTHLY basis, with search + click-to-drill-down
 * timeline modal (same info as the per-employee WorkingHoursModal).
 *
 * It reuses your EXISTING backend endpoints — no new backend code needed:
 *   GET /punch/shift-summary?date=&company_id=            -> daily list (all employees)
 *   GET /punch/monthly-shift-summary?month=&year=&company_id=  -> monthly list (all employees)
 *   GET /punch/employee/:employeeId?date=                 -> raw punches for one employee/day
 *   GET /punch/working-hours?employeeId=&date=            -> HOME/OFFICE/FIELD breakdown
 *
 * NOTE: adjust `getCompanyId()` below if your company_id is stored/derived
 * differently than `localStorage.user.company_id`.
 * ------------------------------------------------------------------- */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL

// ── design tokens ────────────────────────────────────────────────────
// Signal-room palette: paper surface, ink text, a single "presence" teal
// that echoes the HOME/OFFICE/FIELD signal this product already tracks.
const T = {
    bg: '#FAFAF8',
    surface: '#FFFFFF',
    border: '#E7E4DD',
    borderSoft: '#F0EEE8',
    ink: '#171A21',
    inkMuted: '#6E7180',
    inkFaint: '#A2A5B0',
    signal: '#0E7C61',     
    signalBg: '#E7F5EF',
    amber: '#B4650B',       
    amberBg: '#FCF1E3',
    danger: '#C23B2E',     
    dangerBg: '#FBEAE8',
    info: '#2E4FC4',        
    infoBg: '#EAEDFB',
    neutral: '#8B8F99',    
    neutralBg: '#F2F1ED',
    home: '#0E7C61',
    office: '#2E4FC4',
    field: '#B4650B',
}

const FontImports = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .aad-root, .aad-root * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        .aad-display { font-family: 'Fraunces', Georgia, serif; }
        .aad-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        .aad-row-hover:hover { background: #F7F6F2 !important; }
        .aad-pulse { animation: aadPulse 2.2s ease-in-out infinite; }
        @keyframes aadPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .aad-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .aad-scrollbar::-webkit-scrollbar-thumb { background: #DEDBD3; border-radius: 8px; }
    `}</style>
)

// ── helpers ────────────────────────────────────────────────────────────
const getCompanyId = (): string => {
    if (typeof window === 'undefined') return ''
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        return user?.company_id || ''
    } catch {
        return ''
    }
}

const formatTime = (obj: any) => `${obj?.h || obj?.hours || 0}h ${obj?.m || obj?.minutes || 0}m ${obj?.s || obj?.seconds || 0}s`

const todayStr = () => new Date().toISOString().split('T')[0]

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const initialsOf = (a: string, b: string) => `${a?.[0] || ''}${b?.[0] || ''}`.toUpperCase() || '—'

const getAvatarStyle = (first: string, last: string) => {
    const name = `${first || ''} ${last || ''}`;
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hues = [160, 200, 36, 325, 260, 185, 23]; // Teal, Blue, Amber, Pink, Purple, Sky, Orange
    const hue = hues[hash % hues.length];
    return {
        background: `hsl(${hue}, 75%, 95%)`,
        color: `hsl(${hue}, 75%, 26%)`,
        border: `1px solid hsl(${hue}, 75%, 85%)`
    };
}

const toMin = (t: string) => {
    const h = Number(t?.match(/(\d+)h/)?.[1] || 0)
    const m = Number(t?.match(/(\d+)m/)?.[1] || 0)
    return h * 60 + m
}
const fmtMin = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`

// ── types ──────────────────────────────────────────────────────────────
interface DailyEmployeeRow {
    employeeId: string
    first_name: string
    last_name: string
    location?: string
    designation?: string
    punchIn: string
    punchOut: string
    totalShiftTime: string
    totalBreakTime: string
    netWorkingTime: string
    shiftRequired: string
    shiftStatus: string
    status: string
    fieldVisits?: number
}

interface MonthlyDayRow extends DailyEmployeeRow {
    date: string
}

// ── Lightbox ──────────────────────────────────────────────────────────
const ImageLightbox: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => (
    <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(10,12,16,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out'
    }}>
        <button onClick={onClose} style={{
            position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.12)',
            border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer'
        }}>✕</button>
        <img src={src} alt="Full view" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: 10 }} />
    </div>
)

// ── Status badge ──────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { bg: string; color: string; dot: string; label?: string }> = {
    PRESENT: { bg: T.signalBg, color: T.signal, dot: T.signal },
    ABSENT: { bg: T.dangerBg, color: T.danger, dot: T.danger },
    ON_LEAVE: { bg: T.infoBg, color: T.info, dot: T.info },
    ON_HALF: { bg: T.amberBg, color: T.amber, dot: T.amber },
    NOT_PUNCHED_IN: { bg: T.neutralBg, color: T.neutral, dot: T.neutral },
    NOT_PUNCHED_OUT: { bg: T.amberBg, color: T.amber, dot: T.amber },
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const s = STATUS_MAP[status] || { bg: T.neutralBg, color: T.neutral, dot: T.neutral }
    return (
        <span style={{
            fontSize: 11, fontWeight: 600, padding: '4px 10px 4px 8px', borderRadius: 99,
            background: s.bg, color: s.color, whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: 6, letterSpacing: 0.2
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
            {status?.replace(/_/g, ' ') || '—'}
        </span>
    )
}

// ── compact HOME/OFFICE/FIELD activity ribbon (signature element) ────
const ActivityRibbon: React.FC<{ home: number; office: number; field: number; width?: number }> = ({ home, office, field, width = 90 }) => {
    const total = home + office + field
    if (total <= 0) {
        return <div style={{ width, height: 6, borderRadius: 3, background: T.borderSoft }} />
    }
    const hw = (home / total) * 100
    const ow = (office / total) * 100
    const fw = (field / total) * 100
    return (
        <div style={{ display: 'flex', width, height: 6, borderRadius: 3, overflow: 'hidden', background: T.borderSoft }}
            title={`Home ${Math.round(hw)}% · Office ${Math.round(ow)}% · Field ${Math.round(fw)}%`}>
            {hw > 0 && <div style={{ width: `${hw}%`, background: T.home }} />}
            {ow > 0 && <div style={{ width: `${ow}%`, background: T.office }} />}
            {fw > 0 && <div style={{ width: `${fw}%`, background: T.field }} />}
        </div>
    )
}

// ── KPI stat card ──────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string; accent: string; accentBg: string; sub?: string; live?: boolean; children?: React.ReactNode }> = ({ label, value, accent, accentBg, sub, live, children }) => (
    <div style={{
        flex: '1 1 140px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '14px 16px', minWidth: 130, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
    }}>
        <div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: accent }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {live && <span className="aad-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />}
                <div style={{ fontSize: 11, fontWeight: 600, color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            </div>
            <div className="aad-mono aad-display" style={{ fontSize: 26, fontWeight: 600, color: T.ink, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 4 }}>{sub}</div>}
        </div>
        {children}
    </div>
)

// ── Employee timeline detail modal (self-fetching) ───────────────────
const EmployeeTimelineModal: React.FC<{
    employeeId: string
    employeeName: string
    date: string
    onClose: () => void
}> = ({ employeeId, employeeName, date, onClose }) => {
    const [punches, setPunches] = useState<any[]>([])
    const [totals, setTotals] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedPunch, setSelectedPunch] = useState<any>(null)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const [punchRes, hoursRes] = await Promise.all([
                    fetch(`${APP_URL}/punch/employee/${employeeId}?date=${date}`),
                    fetch(`${APP_URL}/punch/working-hours?employeeId=${employeeId}&date=${date}`),
                ])
                const punchData = await punchRes.json()
                const hoursData = await hoursRes.json()
                if (!cancelled) {
                    setPunches(Array.isArray(punchData) ? punchData : [])
                    setTotals(hoursData)
                }
            } catch (e) {
                if (!cancelled) setError('Failed to load timeline.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [employeeId, date])

    const homeSec = (totals?.HOME?.h || 0) * 3600 + (totals?.HOME?.m || 0) * 60 + (totals?.HOME?.s || 0)
    const officeSec = (totals?.OFFICE?.h || 0) * 3600 + (totals?.OFFICE?.m || 0) * 60 + (totals?.OFFICE?.s || 0)
    const fieldSec = (totals?.FIELD?.h || 0) * 3600 + (totals?.FIELD?.m || 0) * 60 + (totals?.FIELD?.s || 0)
    const totalSec = homeSec + officeSec + fieldSec
    const pct = (sec: number) => totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0

    const slots = [
        { label: 'Home', icon: '⌂', value: formatTime(totals?.HOME), percent: pct(homeSec), color: T.home },
        { label: 'Office', icon: '▣', value: formatTime(totals?.OFFICE), percent: pct(officeSec), color: T.office },
        { label: 'Field', icon: '➤', value: formatTime(totals?.FIELD), percent: pct(fieldSec), color: T.field },
    ]

    return (
        <>
            <div className="aad-root" onClick={onClose} style={{
                position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,17,23,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(2px)'
            }}>
                <div onClick={e => e.stopPropagation()} style={{
                    background: 'linear-gradient(180deg, #14171F 0%, #1B1F2A 100%)', borderRadius: 18,
                    padding: 24, width: '100%', maxWidth: 620, maxHeight: '88vh', overflowY: 'auto',
                    boxShadow: '0 30px 70px rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.07)',
                }} className="aad-scrollbar">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, background: 'rgba(14,124,97,0.18)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: T.home, fontWeight: 700, fontSize: 13, flexShrink: 0
                            }} className="aad-mono">{employeeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                            <div>
                                <div className="aad-display" style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>{employeeName}</div>
                                <div className="aad-mono" style={{ fontSize: 12.5, color: '#8B90A0', marginTop: 2 }}>{date}</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9BA0B0', cursor: 'pointer', fontSize: 14, width: 28, height: 28, borderRadius: 8 }}>✕</button>
                    </div>

                    {loading && (
                        <div style={{ color: '#8B90A0', textAlign: 'center', padding: '30px 0', fontSize: 13 }}>Loading timeline…</div>
                    )}

                    {!loading && error && (
                        <div style={{ color: '#f87171', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>{error}</div>
                    )}

                    {!loading && !error && punches.length === 0 && (
                        <div style={{ color: '#8B90A0', textAlign: 'center', padding: '30px 0', fontSize: 13 }}>No punch record for this date.</div>
                    )}

                    {!loading && !error && punches.length > 0 && (
                        <>
                            {/* Type breakdown cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                {slots.map(slot => (
                                    <div key={slot.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: 10 }}>
                                        <div style={{ color: slot.color, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span>{slot.icon}</span>{slot.label}
                                        </div>
                                        <div className="aad-mono" style={{ color: '#fff', fontSize: 13.5, marginTop: 4 }}>{slot.value}</div>
                                        <div style={{ color: '#6B7080', fontSize: 11, marginTop: 2 }}>{slot.percent}% of day</div>
                                    </div>
                                ))}
                            </div>

                            {/* Timeline */}
                            {/* Timeline */}
                            <div style={{ marginTop: 18 }}>
                                <div style={{ color: '#8B90A0', marginBottom: 8, fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Activity Timeline</div>
                                {punches.map((p: any, i: number) => (
                                    <div key={i} style={{
                                        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 8,
                                        display: 'flex', flexDirection: 'column', gap: 10
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div className="aad-mono" style={{ color: '#fff', fontSize: 13.5, fontWeight: 500 }}>{p.punchIn} → {p.punchOut || 'Running'}</div>
                                                <div style={{ color: '#9CA3AF', fontSize: 11.5, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: 4,
                                                        background: p.type === 'FIELD' ? 'rgba(245,158,11,0.15)' : p.type === 'OFFICE' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                                                        color: p.type === 'FIELD' ? '#FBBF24' : p.type === 'OFFICE' ? '#60A5FA' : '#34D399',
                                                        fontSize: 10,
                                                        fontWeight: 600
                                                    }}>{p.type}</span>
                                                    {p.agenda && <span>· {p.agenda}</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <div className="aad-mono" style={{ color: T.home, fontSize: 12.5, fontWeight: 600 }}>{p.totalTime || (p.punchOut ? '' : 'Running')}</div>
                                                <span onClick={() => setSelectedPunch(p)} style={{
                                                    cursor: 'pointer', fontSize: 13, color: '#7FA8FF',
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    background: 'rgba(127,168,255,0.12)', padding: '4px 8px', borderRadius: 6,
                                                    transition: 'background 0.2s'
                                                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,168,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(127,168,255,0.12)'}>
                                                    👁 View Details
                                                    {p.punchInImage && (
                                                        <span style={{ fontSize: 10, background: 'rgba(127,168,255,0.2)', color: '#7FA8FF', padding: '1px 4px', borderRadius: 4, fontWeight: 600 }}>📷</span>
                                                    )}
                                                    {p.type === 'FIELD' && p.contacts?.length > 0 && (
                                                        <span style={{ fontSize: 10, background: 'rgba(14,124,97,0.25)', color: '#8FE0C4', padding: '1px 4px', borderRadius: 4, fontWeight: 600 }}>{p.contacts.length}</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {p.switchLogs?.length > 1 && (
                                            <div style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                                borderRadius: 8,
                                                padding: 10,
                                                marginTop: 4
                                            }}>
                                                <div style={{ color: '#8B90A0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Switch Log Timeline</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {p.switchLogs.map((s: any, idx: number) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            background: 'rgba(255,255,255,0.03)',
                                                            padding: '6px 10px',
                                                            borderRadius: 6,
                                                            border: '1px solid rgba(255,255,255,0.03)'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    padding: '2px 6px',
                                                                    borderRadius: 4,
                                                                    background: s.type === 'FIELD' ? 'rgba(245,158,11,0.2)' : s.type === 'OFFICE' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                                                                    color: s.type === 'FIELD' ? '#FBBF24' : s.type === 'OFFICE' ? '#60A5FA' : '#34D399',
                                                                }}>{s.type}</span>
                                                                <span className="aad-mono" style={{ fontSize: 11, color: '#9CA3AF' }}>@{s.time}</span>
                                                                {s.agenda && <span style={{ fontSize: 11, color: '#6B7280' }}>— {s.agenda}</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                {s.frontImage && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setLightboxSrc(s.frontImage) }}
                                                                        style={{
                                                                            background: 'rgba(16,185,129,0.15)',
                                                                            border: '1px solid rgba(16,185,129,0.3)',
                                                                            borderRadius: 4,
                                                                            color: '#34D399',
                                                                            padding: '2px 8px',
                                                                            fontSize: 10.5,
                                                                            cursor: 'pointer',
                                                                            fontWeight: 500,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 4
                                                                        }}>
                                                                        📷 Front
                                                                    </button>
                                                                )}
                                                                {s.backImage && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setLightboxSrc(s.backImage) }}
                                                                        style={{
                                                                            background: 'rgba(59,130,246,0.15)',
                                                                            border: '1px solid rgba(59,130,246,0.3)',
                                                                            borderRadius: 4,
                                                                            color: '#60A5FA',
                                                                            padding: '2px 8px',
                                                                            fontSize: 10.5,
                                                                            cursor: 'pointer',
                                                                            fontWeight: 500,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 4
                                                                        }}>
                                                                        📷 Back
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(14,124,97,0.12)', border: '1px solid rgba(14,124,97,0.25)', borderRadius: 10, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12.5, color: '#8FE0C4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Total Working Time</span>
                                <span className="aad-mono" style={{ fontWeight: 600, fontSize: 15 }}>{formatTime(totals?.total)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Punch detail sub-modal */}
                {selectedPunch && (
                    <div onClick={() => setSelectedPunch(null)} style={{
                        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16
                    }}>
                        <div onClick={e => e.stopPropagation()} style={{
                            background: '#fff', borderRadius: 16, width: 340, maxHeight: '85vh', overflowY: 'auto',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: 'inherit'
                        }}>
                            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.borderSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.amberBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: 15, color: T.amber }}>➤</span>
                                </div>
                                <div style={{ flex: 1, fontSize: 13, color: T.inkMuted }} className="aad-mono">{selectedPunch.type} · {selectedPunch.punchIn} → {selectedPunch.punchOut || 'Running'}</div>
                                <button onClick={() => setSelectedPunch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint, padding: 4 }}>✕</button>
                            </div>

                            {selectedPunch.punchInImage && (
                                <div style={{ padding: '12px 18px 0' }}>
                                    <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Punch In Photo</div>
                                    <img src={selectedPunch.punchInImage} alt="Punch in location"
                                        onClick={() => setLightboxSrc(selectedPunch.punchInImage)}
                                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.borderSoft}`, cursor: 'zoom-in' }} />
                                </div>
                            )}

                            {/* Sub-modal Switch Logs Details & Photos */}
                            {selectedPunch.switchLogs?.length > 0 && (
                                <div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Switch History & Photos</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {selectedPunch.switchLogs.map((log: any, idx: number) => (
                                            <div key={idx} style={{ padding: 10, background: T.bg, border: `1px solid ${T.borderSoft}`, borderRadius: 8 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: log.agenda ? 4 : 8 }}>
                                                    <span style={{
                                                        fontSize: 10.5,
                                                        fontWeight: 700,
                                                        padding: '2px 6px',
                                                        borderRadius: 4,
                                                        background: log.type === 'FIELD' ? T.amberBg : log.type === 'OFFICE' ? T.infoBg : T.signalBg,
                                                        color: log.type === 'FIELD' ? T.field : log.type === 'OFFICE' ? T.office : T.signal,
                                                    }}>{log.type}</span>
                                                    <span className="aad-mono" style={{ fontSize: 11, color: T.inkMuted }}>{log.time}</span>
                                                </div>
                                                {log.agenda && (
                                                    <div style={{ fontSize: 12, color: T.inkMuted, marginBottom: 8, fontStyle: 'italic' }}>
                                                        "{log.agenda}"
                                                    </div>
                                                )}
                                                {(log.frontImage || log.backImage) && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                                                        {log.frontImage && (
                                                            <div>
                                                                <div style={{ fontSize: 9.5, color: T.inkFaint, marginBottom: 4, fontWeight: 600 }}>Front Photo</div>
                                                                <img src={log.frontImage} alt="Front Switch Photo"
                                                                    onClick={() => setLightboxSrc(log.frontImage)}
                                                                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, border: `1px solid ${T.borderSoft}`, cursor: 'zoom-in' }} />
                                                            </div>
                                                        )}
                                                        {log.backImage && (
                                                            <div>
                                                                <div style={{ fontSize: 9.5, color: T.inkFaint, marginBottom: 4, fontWeight: 600 }}>Back Photo</div>
                                                                <img src={log.backImage} alt="Back Switch Photo"
                                                                    onClick={() => setLightboxSrc(log.backImage)}
                                                                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, border: `1px solid ${T.borderSoft}`, cursor: 'zoom-in' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedPunch.contacts?.length > 0 && <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Field Contacts</div>}
                                {selectedPunch.contacts?.map((c: any, i: number) => {
                                    const initials = c.personName?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
                                    const isSuccess = c.status === 'SUCCESS'
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: T.bg, borderRadius: 8, border: `1px solid ${T.borderSoft}` }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.infoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: T.info, flexShrink: 0 }}>{initials}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.personName}</div>
                                                <div style={{ fontSize: 12, color: T.inkMuted }}>{c.contact}</div>
                                                {c.agenda && <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }} title={c.agenda}>📝 {c.agenda}</div>}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, flexShrink: 0, background: isSuccess ? T.signalBg : T.dangerBg, border: `1px solid ${isSuccess ? '#BFE3D5' : '#F1CCC7'}` }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: isSuccess ? T.signal : T.danger }}>{isSuccess ? '✓ Success' : '✗ Failed'}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.borderSoft}`, display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setSelectedPunch(null)} style={{ padding: '7px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: 'transparent', color: T.inkMuted, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
        </>
    )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────
const AttendanceActivityDashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
    const [search, setSearch] = useState('')

    // daily state
    const [selectedDate, setSelectedDate] = useState(todayStr())
    const [dailyRows, setDailyRows] = useState<DailyEmployeeRow[]>([])

    // monthly state
    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [monthlyRows, setMonthlyRows] = useState<MonthlyDayRow[]>([])
    const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [modalTarget, setModalTarget] = useState<{ employeeId: string; employeeName: string; date: string } | null>(null)
    const [fieldEmpsModalTarget, setFieldEmpsModalTarget] = useState<'daily' | 'monthly' | null>(null)

    const companyId = getCompanyId()

    const loadDaily = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${APP_URL}/punch/shift-summary?date=${selectedDate}&company_id=${companyId}`)
            const data = await res.json()
            setDailyRows(data?.employees || [])
        } catch (e) {
            setError('Failed to load daily attendance.')
        } finally {
            setLoading(false)
        }
    }, [selectedDate, companyId])

    const loadMonthly = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${APP_URL}/punch/monthly-shift-summary?month=${selectedMonth}&year=${selectedYear}&company_id=${companyId}`)
            const data = await res.json()
            setMonthlyRows(data?.employees || [])
        } catch (e) {
            setError('Failed to load monthly attendance.')
        } finally {
            setLoading(false)
        }
    }, [selectedMonth, selectedYear, companyId])

    useEffect(() => {
        if (viewMode === 'daily') loadDaily()
        else loadMonthly()
    }, [viewMode, loadDaily, loadMonthly])

    // filter by search (name)
    const filteredDaily = dailyRows.filter(r =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase())
    )

    // group monthly rows by employee
    const monthlyByEmployee: Record<string, { employeeId: string; name: string; designation?: string; location?: string; days: MonthlyDayRow[] }> = {}
    monthlyRows.forEach(r => {
        const key = r.employeeId
        if (!monthlyByEmployee[key]) {
            monthlyByEmployee[key] = { employeeId: r.employeeId, name: `${r.first_name} ${r.last_name}`, designation: r.designation, location: r.location, days: [] }
        }
        monthlyByEmployee[key].days.push(r)
    })
    const monthlyGrouped = Object.values(monthlyByEmployee).filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
    )

    // ── KPI summary (computed client-side, no new endpoints needed) ──
    const dailyKpis = useMemo(() => {
        const total = dailyRows.length
        const present = dailyRows.filter(r => r.status === 'PRESENT').length
        const absent = dailyRows.filter(r => r.status === 'ABSENT').length
        const onLeave = dailyRows.filter(r => r.status === 'ON_LEAVE').length
        const netMins = dailyRows.map(r => toMin(r.netWorkingTime)).filter(m => m > 0)
        const avgMin = netMins.length ? Math.round(netMins.reduce((a, b) => a + b, 0) / netMins.length) : 0
        const totalFieldVisits = dailyRows.reduce((a, r) => a + (r.fieldVisits || 0), 0)
        const attendanceRate = total ? Math.round((present / total) * 100) : 0
        return { total, present, absent, onLeave, avgMin, totalFieldVisits, attendanceRate }
    }, [dailyRows])

    const monthlyKpis = useMemo(() => {
        const employees = Object.values(monthlyByEmployee)
        const totalDaysLogged = monthlyRows.length
        const avgDaysPerEmp = employees.length ? Math.round((totalDaysLogged / employees.length) * 10) / 10 : 0
        const allNetMins = monthlyRows.map(r => toMin(r.netWorkingTime)).filter(m => m > 0)
        const avgMin = allNetMins.length ? Math.round(allNetMins.reduce((a, b) => a + b, 0) / allNetMins.length) : 0
        const absences = monthlyRows.filter(r => r.status === 'ABSENT').length
        const totalFieldVisits = monthlyRows.reduce((a, r) => a + (r.fieldVisits || 0), 0)
        return { employeeCount: employees.length, totalDaysLogged, avgDaysPerEmp, avgMin, absences, totalFieldVisits }
    }, [monthlyRows, monthlyByEmployee])

    const dailyFieldEmps = useMemo(() => {
        return dailyRows.filter(r => r.fieldVisits && r.fieldVisits > 0)
    }, [dailyRows])

    const monthlyFieldEmps = useMemo(() => {
        return Object.values(monthlyByEmployee)
            .map(emp => ({
                ...emp,
                visits: emp.days.reduce((sum, d) => sum + (d.fieldVisits || 0), 0)
            }))
            .filter(emp => emp.visits > 0)
            .sort((a, b) => b.visits - a.visits)
    }, [monthlyByEmployee])

    const thStyle: React.CSSProperties = { textAlign: 'left', padding: '11px 14px', fontSize: 11, color: T.inkMuted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.4 }
    const tdStyle: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.borderSoft}`, whiteSpace: 'nowrap' }

    return (
        <div className="aad-root" style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px', background: T.bg }}>
            <FontImports />

            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div className="aad-display" style={{ fontSize: 24, fontWeight: 600, color: T.ink, letterSpacing: -0.3 }}>Employee Activity</div>
                    <div style={{ fontSize: 13, color: T.inkMuted, marginTop: 2 }}>
                        {viewMode === 'daily'
                            ? `Live attendance signal for ${selectedDate}`
                            : `Rollup for ${monthNames[selectedMonth - 1]} ${selectedYear}`}
                    </div>
                </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                {viewMode === 'daily' ? (
                    <>
                        {/* <StatCard label="Present" value={String(dailyKpis.present)} accent={T.signal} accentBg={T.signalBg} sub={`of ${dailyKpis.total} employees`} live /> */}
                        {/* <StatCard label="Absent" value={String(dailyKpis.absent)} accent={T.danger} accentBg={T.dangerBg} /> */}
                        <StatCard label="Field Employees" value={String(dailyFieldEmps.length)} accent={T.field} accentBg={T.amberBg} sub="employees in field today">
                            {dailyFieldEmps.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 8, width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        {dailyFieldEmps.slice(0, 3).map(emp => {
                                            const avatarStyle = getAvatarStyle(emp.first_name, emp.last_name);

                                            const initials = initialsOf(emp.first_name, emp.last_name);

                                            return (
                                                <div
                                                    key={emp.employeeId}
                                                    title={`${emp.first_name} ${emp.last_name} (${emp.fieldVisits} visit${emp.fieldVisits > 1 ? 's' : ''})`}
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 8.5,
                                                        fontWeight: 750,
                                                        ...avatarStyle,
                                                        cursor: 'help',
                                                    }}
                                                >
                                                    {initials}
                                                </div>
                                            );
                                        })}

                                        {dailyFieldEmps.length > 3 && (
                                            <div style={{ fontSize: 9, color: T.inkMuted, fontWeight: 600, }}>
                                                +{dailyFieldEmps.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFieldEmpsModalTarget('daily'); }}

                                        style={{
                                            border: 'none',
                                            background: 'rgba(46,79,196,0.08)',
                                            color: T.office,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            padding: '3px 7px',
                                            borderRadius: 4,
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap',
                                        }}
                                        onMouseEnter={e =>
                                        (e.currentTarget.style.background =
                                            'rgba(46,79,196,0.15)')
                                        }
                                        onMouseLeave={e =>
                                        (e.currentTarget.style.background =
                                            'rgba(46,79,196,0.08)')
                                        }
                                    >
                                        View Names
                                    </button>
                                </div>
                            )}
                        </StatCard>
                        <StatCard label="Field Visits" value={String(dailyKpis.totalFieldVisits)} accent={T.field} accentBg={T.amberBg} sub="visits logged today" />
                        {/* <StatCard label="Field Visit Days" value={String(dailyFieldEmps.length)} accent={T.field} accentBg={T.amberBg} sub="employee visits today" /> */}
                    </>
                ) : (
                    <>
                        <StatCard label="Field Visit Employees" value={String(monthlyFieldEmps.length)} accent={T.signal} accentBg={T.signalBg} />
                        <StatCard label="Total Field Visits" value={String(monthlyKpis.totalFieldVisits)} accent={T.field} accentBg={T.amberBg} sub="across all staff">
                            {monthlyFieldEmps.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 8, width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        {monthlyFieldEmps.slice(0, 3).map(emp => {
                                            const avatarStyle = getAvatarStyle(emp.name, '');
                                            const initials = emp.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                                            return (
                                                <div
                                                    key={emp.employeeId}
                                                    title={`${emp.name} (${emp.visits} visit${emp.visits > 1 ? 's' : ''})`}
                                                    style={{
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 8.5,
                                                        fontWeight: 750,
                                                        ...avatarStyle,
                                                        cursor: 'help'
                                                    }}
                                                >
                                                    {initials}
                                                </div>
                                            )
                                        })}
                                        {monthlyFieldEmps.length > 3 && (
                                            <div style={{ fontSize: 9, color: T.inkMuted, fontWeight: 600 }}>
                                                +{monthlyFieldEmps.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFieldEmpsModalTarget('monthly'); }}
                                        style={{
                                            border: 'none', background: 'rgba(46,79,196,0.08)', color: T.office, fontSize: 10, fontWeight: 700,
                                            cursor: 'pointer', padding: '3px 7px', borderRadius: 4, transition: 'all 0.2s', whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(46,79,196,0.15)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(46,79,196,0.08)'}
                                    >
                                        View Names
                                    </button>
                                </div>
                            )}
                        </StatCard>
                        {/* <StatCard label="Avg. Days Logged" value={String(monthlyKpis.avgDaysPerEmp)} accent={T.office} accentBg={T.infoBg} sub="per employee" />
                        <StatCard label="Avg. Net Working" value={monthlyKpis.avgMin ? fmtMin(monthlyKpis.avgMin) : '—'} accent={T.office} accentBg={T.infoBg} sub="per logged day" /> */}
                        {/* <StatCard label="Absences Logged" value={String(monthlyKpis.absences)} accent={T.danger} accentBg={T.dangerBg} /> */}
                    </>
                )}
            </div>

            <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>

                {/* Filters */}
                <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', borderBottom: `1px solid ${T.border}`, background: '#FCFBF9' }}>
                    <div style={{ display: 'flex', gap: 6, background: T.bg, padding: 3, borderRadius: 9, border: `1px solid ${T.border}` }}>
                        <button
                            onClick={() => setViewMode('daily')}
                            style={{
                                padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                                border: 'none',
                                background: viewMode === 'daily' ? T.surface : 'transparent',
                                color: viewMode === 'daily' ? T.ink : T.inkMuted,
                                boxShadow: viewMode === 'daily' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s',
                            }}
                        >Daily</button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            style={{
                                padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                                border: 'none',
                                background: viewMode === 'monthly' ? T.surface : 'transparent',
                                color: viewMode === 'monthly' ? T.ink : T.inkMuted,
                                boxShadow: viewMode === 'monthly' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s',
                            }}
                        >Monthly</button>
                    </div>

                    <input
                        placeholder="Search employee by name…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            flex: '1 1 220px', padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
                            fontSize: 13, outline: 'none', background: T.surface, color: T.ink
                        }}
                    />

                    {viewMode === 'daily' ? (
                        <input
                            type="date"
                            value={selectedDate}
                            max={todayStr()}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="aad-mono"
                            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, background: T.surface, color: T.ink }}
                        />
                    ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, background: T.surface, color: T.ink }}
                            >
                                {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={e => setSelectedYear(Number(e.target.value))}
                                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, background: T.surface, color: T.ink }}
                            >
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const y = now.getFullYear() - i
                                    return <option key={y} value={y}>{y}</option>
                                })}
                            </select>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="aad-scrollbar" style={{ overflowX: 'auto' }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: T.inkMuted, fontSize: 13 }}>
                            <span className="aad-pulse" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: T.signal, marginRight: 8, verticalAlign: 'middle' }} />
                            Loading activity…
                        </div>
                    )}

                    {!loading && error && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: T.danger, fontSize: 13 }}>{error}</div>
                    )}

                    {!loading && !error && viewMode === 'daily' && (
                        filteredDaily.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0', color: T.inkFaint, fontSize: 13 }}>No employees found for {selectedDate}.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Employee</th>
                                        <th style={thStyle}>Designation</th>
                                        <th style={thStyle}>Punch In</th>
                                        <th style={thStyle}>Punch Out</th>
                                        <th style={thStyle}>Net Working</th>
                                        <th style={thStyle}>Field Visits</th>
                                        <th style={thStyle}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDaily.map(r => (
                                        <tr
                                            key={r.employeeId}
                                            className="aad-row-hover"
                                            onClick={() => setModalTarget({ employeeId: r.employeeId, employeeName: `${r.first_name} ${r.last_name}`, date: selectedDate })}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: 8,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                        ...getAvatarStyle(r.first_name, r.last_name)
                                                    }} className="aad-mono">{initialsOf(r.first_name, r.last_name)}</div>
                                                    <span style={{ fontWeight: 500 }}>{r.first_name} {r.last_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, color: T.inkMuted }}>{r.designation || '—'}</td>
                                            <td style={{ ...tdStyle }} className="aad-mono">{r.punchIn || '—'}</td>
                                            <td style={{ ...tdStyle }} className="aad-mono">{r.punchOut || '—'}</td>
                                            <td style={{ ...tdStyle, fontWeight: 600 }} className="aad-mono">{r.netWorkingTime || '—'}</td>
                                            <td style={{ ...tdStyle }} className="aad-mono">
                                                {r.fieldVisits && r.fieldVisits > 0 ? (
                                                    <span style={{ background: T.amberBg, color: T.field, padding: '3px 8px', borderRadius: 6, fontWeight: 600, fontSize: 11.5 }}>
                                                        🚀 {r.fieldVisits} {r.fieldVisits === 1 ? 'visit' : 'visits'}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={tdStyle}><StatusBadge status={r.status} /></td>
                                            <td style={{ ...tdStyle, color: T.signal, fontWeight: 600, fontSize: 12 }}>View →</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}

                    {!loading && !error && viewMode === 'monthly' && (
                        monthlyGrouped.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 0', color: T.inkFaint, fontSize: 13 }}>No records for {monthNames[selectedMonth - 1]} {selectedYear}.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Employee</th>
                                        <th style={thStyle}>Designation</th>
                                        <th style={thStyle}>Days Recorded</th>
                                        <th style={thStyle}>Total Shift</th>
                                        <th style={thStyle}>Total Break</th>
                                        <th style={thStyle}>Net Working</th>
                                        <th style={thStyle}>Field Visits</th>
                                        <th style={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyGrouped.map(emp => {
                                        const totalShiftMin = emp.days.reduce((a, d) => a + toMin(d.totalShiftTime), 0)
                                        const totalBreakMin = emp.days.reduce((a, d) => a + toMin(d.totalBreakTime), 0)
                                        const totalNetMin = emp.days.reduce((a, d) => a + toMin(d.netWorkingTime), 0)
                                        const totalFieldVisits = emp.days.reduce((a, d) => a + (d.fieldVisits || 0), 0)
                                        const isExpanded = expandedEmployee === emp.employeeId

                                        return (
                                            <React.Fragment key={emp.employeeId}>
                                                <tr
                                                    className="aad-row-hover"
                                                    onClick={() => setExpandedEmployee(isExpanded ? null : emp.employeeId)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                            <span style={{ color: T.inkFaint, fontSize: 10, width: 10, display: 'inline-block' }}>{isExpanded ? '▾' : '▸'}</span>
                                                            <div style={{
                                                                width: 28, height: 28, borderRadius: 8,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                                ...getAvatarStyle(emp.name, '')
                                                            }} className="aad-mono">{emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                            <span style={{ fontWeight: 500 }}>{emp.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ ...tdStyle, color: T.inkMuted }}>{emp.designation || '—'}</td>
                                                    <td style={{ ...tdStyle, fontWeight: 600 }} className="aad-mono">{emp.days.length}</td>
                                                    <td style={tdStyle} className="aad-mono">{fmtMin(totalShiftMin)}</td>
                                                    <td style={tdStyle} className="aad-mono">{fmtMin(totalBreakMin)}</td>
                                                    <td style={{ ...tdStyle, fontWeight: 600 }} className="aad-mono">{fmtMin(totalNetMin)}</td>
                                                    <td style={{ ...tdStyle, color: T.field, fontWeight: 600 }} className="aad-mono">
                                                        {totalFieldVisits > 0 ? (
                                                            <span style={{ background: T.amberBg, color: T.field, padding: '3px 8px', borderRadius: 6, fontWeight: 600, fontSize: 11.5 }}>
                                                                {totalFieldVisits} {totalFieldVisits === 1 ? 'time' : 'times'}
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td style={tdStyle}></td>
                                                </tr>
                                                {isExpanded && emp.days
                                                    .slice()
                                                    .sort((a, b) => a.date.localeCompare(b.date))
                                                    .map(day => (
                                                        <tr
                                                            key={day.date}
                                                            onClick={() => setModalTarget({ employeeId: emp.employeeId, employeeName: emp.name, date: day.date })}
                                                            style={{ cursor: 'pointer', background: '#FBFAF7' }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = '#F4F7F4')}
                                                            onMouseLeave={e => (e.currentTarget.style.background = '#FBFAF7')}
                                                        >
                                                            <td style={{ ...tdStyle, paddingLeft: 40, color: T.inkMuted }} className="aad-mono">{day.date}</td>
                                                            <td style={tdStyle} className="aad-mono">—</td>
                                                            <td style={tdStyle} className="aad-mono">{day.punchIn || '—'} → {day.punchOut || '—'}</td>
                                                            <td style={tdStyle} className="aad-mono">{day.totalShiftTime}</td>
                                                            <td style={tdStyle} className="aad-mono">{day.totalBreakTime}</td>
                                                            <td style={tdStyle} className="aad-mono">{day.netWorkingTime}</td>
                                                            <td style={{ ...tdStyle, color: T.field, fontWeight: 600 }} className="aad-mono">
                                                                {day.fieldVisits && day.fieldVisits > 0 ? `${day.fieldVisits} visit${day.fieldVisits > 1 ? 's' : ''}` : '—'}
                                                            </td>
                                                            <td style={tdStyle}><StatusBadge status={day.status} /></td>
                                                            <td style={{ ...tdStyle, color: T.signal, fontWeight: 600, fontSize: 12 }}>View →</td>
                                                        </tr>
                                                    ))}
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            </div>

            {modalTarget && (
                <EmployeeTimelineModal
                    employeeId={modalTarget.employeeId}
                    employeeName={modalTarget.employeeName}
                    date={modalTarget.date}
                    onClose={() => setModalTarget(null)}
                />
            )}

            {/* Popover overlay modal for field visit staff list */}
            {fieldEmpsModalTarget && (
                <div onClick={() => setFieldEmpsModalTarget(null)} style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,17,23,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(2px)'
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '80vh',
                        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: `1px solid ${T.border}`
                    }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>Field Visits Staff</div>
                                <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 2 }}>
                                    {fieldEmpsModalTarget === 'daily' ? `Logged today: ${selectedDate}` : `Logged in month: ${monthNames[selectedMonth - 1]}`}
                                </div>
                            </div>
                            <button onClick={() => setFieldEmpsModalTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkMuted, fontSize: 16 }}>✕</button>
                        </div>
                        <div style={{ padding: '12px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }} className="aad-scrollbar">
                            {fieldEmpsModalTarget === 'daily' ? (
                                dailyFieldEmps.map(emp => (
                                    <div key={emp.employeeId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: T.bg, border: `1px solid ${T.borderSoft}`, borderRadius: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ...getAvatarStyle(emp.first_name, emp.last_name) }}>
                                                {initialsOf(emp.first_name, emp.last_name)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{emp.first_name} {emp.last_name}</div>
                                                <div style={{ fontSize: 11.5, color: T.inkMuted }}>{emp.designation || 'Staff'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11.5, fontWeight: 600, color: T.field, background: T.amberBg, padding: '3px 8px', borderRadius: 6 }}>
                                                {emp.fieldVisits} visit{emp.fieldVisits! > 1 ? 's' : ''}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setFieldEmpsModalTarget(null);
                                                    setModalTarget({ employeeId: emp.employeeId, employeeName: `${emp.first_name} ${emp.last_name}`, date: selectedDate });
                                                }}
                                                style={{ border: 'none', background: 'none', color: T.office, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 4 }}
                                            >
                                                Details →
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                monthlyFieldEmps.map(emp => (
                                    <div key={emp.employeeId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: T.bg, border: `1px solid ${T.borderSoft}`, borderRadius: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ...getAvatarStyle(emp.name, '') }}>
                                                {emp.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{emp.name}</div>
                                                <div style={{ fontSize: 11.5, color: T.inkMuted }}>{emp.designation || 'Staff'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11.5, fontWeight: 600, color: T.field, background: T.amberBg, padding: '3px 8px', borderRadius: 6 }}>
                                                {emp.visits} visit{emp.visits > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.borderSoft}`, display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setFieldEmpsModalTarget(null)} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 8, background: 'transparent', color: T.inkMuted, fontSize: 12.5, cursor: 'pointer', fontWeight: 500 }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AttendanceActivityDashboard
