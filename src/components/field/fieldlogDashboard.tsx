'use client'

import React, { useEffect, useState } from 'react'

interface FieldMeeting {
    personName: string
    contact: string
    agenda: string
    time: string
    frontImage?: string
    backImage?: string
    remarks?: string
}

interface FieldEmployeeSummary {
    employeeId: string
    first_name: string
    last_name: string
    designation?: string
    totalMeetings: number
    totalFieldTime: string
    daysOnField?: number
    meetings: FieldMeeting[]
}

interface FieldLogsDashboardProps {
    // Pass these in from the parent page (same pattern as PunchInOut)
    companyId: string
    employeeId: string
    isAdmin?: boolean // true = HR/Admin view (see everyone), false = employee sees only their own row
}

const ImageLightbox: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => (
    <div
        onClick={onClose}
        style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'zoom-out'
        }}
    >
        <button
            onClick={onClose}
            style={{
                position: 'absolute', top: 18, right: 18,
                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer'
            }}
        >✕</button>
        <img
            src={src}
            alt="Full view"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: 10 }}
        />
    </div>
)

const initialsOf = (name: string) =>
    name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

const EmployeeFieldCard: React.FC<{
    emp: FieldEmployeeSummary
    onImageClick: (src: string) => void
}> = ({ emp, onImageClick }) => {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
            >
                <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                    {initialsOf(`${emp.first_name} ${emp.last_name}`)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                        {emp.first_name} {emp.last_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{emp.designation || '—'}</div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                        <div className="text-sm font-semibold text-blue-600">{emp.totalMeetings}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">Meetings</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-amber-600">{emp.totalFieldTime}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">Field Time</div>
                    </div>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {emp.meetings.map((m, i) => (
                        <div key={i} className="p-4 flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                                {initialsOf(m.personName)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-medium text-gray-900 truncate">{m.personName || 'Unnamed contact'}</div>
                                    <div className="text-xs text-gray-400 flex-shrink-0">{m.time}</div>
                                </div>
                                {m.contact && <div className="text-xs text-gray-500">{m.contact}</div>}
                                {m.agenda && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        <span className="text-gray-400">Agenda: </span>{m.agenda}
                                    </div>
                                )}
                                {m.remarks && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        <span className="text-gray-400">Remarks: </span>{m.remarks}
                                    </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                    {m.frontImage && (
                                        <img
                                            src={m.frontImage}
                                            alt="front"
                                            onClick={() => onImageClick(m.frontImage!)}
                                            className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90"
                                        />
                                    )}
                                    {m.backImage && (
                                        <img
                                            src={m.backImage}
                                            alt="back"
                                            onClick={() => onImageClick(m.backImage!)}
                                            className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const FieldLogsDashboard: React.FC<FieldLogsDashboardProps> = ({ companyId, employeeId, isAdmin = false }) => {
    const todayStr = new Date().toISOString().split('T')[0]
    const [date, setDate] = useState(todayStr)
    const [data, setData] = useState<FieldEmployeeSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

    const fetchSummary = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/punch/field-summary?date=${date}&company_id=${companyId}`
            )
            if (!res.ok) throw new Error('Failed to load field logs')
            const json = await res.json()
            setData(json?.employees || [])
        } catch (err: any) {
            setError(err?.message || 'Failed to load field logs')
            setData([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (companyId && date) fetchSummary()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, date])

    const myRow = data.find(e => e.employeeId === employeeId)
    const teamRows = isAdmin ? data.filter(e => e.employeeId !== employeeId) : []

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Field Visit Logs</h1>
                    <p className="text-sm text-gray-500">Meetings, agendas and time spent on field</p>
                </div>
                <input
                    type="date"
                    value={date}
                    max={todayStr}
                    onChange={e => setDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading && (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                </div>
            )}

            {!loading && error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* My field activity */}
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            My Field Activity
                        </h2>
                        {myRow ? (
                            <EmployeeFieldCard emp={myRow} onImageClick={setLightboxSrc} />
                        ) : (
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                                No field meetings logged on {date}.
                            </div>
                        )}
                    </div>

                    {/* Team field activity — admin only */}
                    {isAdmin && (
                        <div>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Team Field Activity ({teamRows.length})
                            </h2>
                            {teamRows.length === 0 ? (
                                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                                    No other employees logged field meetings on {date}.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {teamRows.map(emp => (
                                        <EmployeeFieldCard key={emp.employeeId} emp={emp} onImageClick={setLightboxSrc} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {lightboxSrc && (
                <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </div>
    )
}

export default FieldLogsDashboard
