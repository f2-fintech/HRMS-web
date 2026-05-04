'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConfiguration } from '@/utility/setting-configuration/settingConfig';
import {
    addPunch,
    fetchTotalWorkingHours,
    fetchPunchByEmployeeAndDate,
    updatePunch
} from '@/redux/features/punches/punchesSlice'
import type { RootState } from '@/redux/store'
import useRouterWithMount from '@/utility/useRouterWithMount';
import { useSettings } from '@/@core/hooks/useSettings';
import { useRouter } from 'next/navigation'

interface PunchInOutProps {
    selectedDate: string
    selectedEmployeeId?: string
    disablePunch?: boolean
}

interface ContactEntry {
    personName: string
    contact: string
    status: 'SUCCESS' | 'FAIL'
}

const WHITELIST_EMPLOYEE_IDS = [
    '66bca8d72f1270380b77ab12',
    '66c881fe269ecefff3411649',
    '66bca6192f1270380b77aac5',
    '66bc8bfe2f1270380b77a920',
    '699e8d1b1cf053581b8a4d6e',
    '693926c8c3b776470f4e1a44',
    '69f05869f9659e84d84aaacb'
];

const formatTime = (obj: any) => {
    return `${obj?.h || obj?.hours || 0}h ${obj?.m || obj?.minutes || 0}m ${obj?.s || obj?.seconds || 0}s`;
};

const toSeconds = (obj: any): number => {
    if (!obj) return 0
    const h = obj?.h ?? obj?.hours ?? 0
    const m = obj?.m ?? obj?.minutes ?? 0
    const s = obj?.s ?? obj?.seconds ?? 0
    return h * 3600 + m * 60 + s
}

// ─── Working Hours Modal ───────────────────────────────────────────────────────
const WorkingHoursModal: React.FC<{ totalWorkingHours: any; selectedDate: string; onClose: () => void; punch: any }> = ({
    totalWorkingHours,
    selectedDate,
    onClose,
    punch,
}) => {

    const [selectedPunch, setSelectedPunch] = React.useState<any>(null);

    const homeSec = toSeconds(totalWorkingHours?.HOME)
    const officeSec = toSeconds(totalWorkingHours?.OFFICE)
    const fieldSec = toSeconds(totalWorkingHours?.FIELD)
    const totalSec = homeSec + officeSec + fieldSec

    const pct = (sec: number) => totalSec > 0 ? Math.round((sec / totalSec) * 100) : 0
    const homeP = pct(homeSec)
    const officeP = pct(officeSec)
    const fieldP = 100 - homeP - officeP

    const slots = [
        { label: 'Home', icon: '🏠', value: formatTime(totalWorkingHours?.HOME), percent: homeP, color: '#10b981' },
        { label: 'Office', icon: '🏢', value: formatTime(totalWorkingHours?.OFFICE), percent: officeP, color: '#3b82f6' },
        { label: 'Field', icon: '🚶', value: formatTime(totalWorkingHours?.FIELD), percent: fieldP, color: '#f59e0b' },
    ]

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
        }}>

            <div onClick={e => e.stopPropagation()} style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '20px',
                padding: '24px',
                width: '100%',
                maxWidth: '620px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>{selectedDate}</div>
                    <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}>✕</button>
                </div>

                {/* Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {slots.map(slot => (
                        <div key={slot.label} style={{ background: '#1e293b', padding: '10px', borderRadius: '10px' }}>
                            <div style={{ color: slot.color }}>{slot.icon} {slot.label}</div>
                            <div style={{ color: '#fff' }}>{slot.value}</div>
                        </div>
                    ))}
                </div>

                {/* Timeline */}
                <div style={{ marginTop: '16px' }}>
                    <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Activity Timeline</div>

                    {punch?.map((p: any, i: number) => (
                        <div key={i} style={{
                            background: '#020617',
                            borderRadius: '10px',
                            padding: '8px',
                            marginBottom: '6px',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ color: '#fff' }}>
                                    {p.punchIn} → {p.punchOut || 'Running'}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '11px' }}>{p.type}</div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ color: '#22c55e' }}>{p.totalTime}</div>

                                {/* 👁 BUTTON */}
                                <span
                                    onClick={() => setSelectedPunch(p)}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: '#60a5fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    👁

                                   
                                    {p.type === 'FIELD' && p.contacts?.length > 0 && (
                                        <span style={{
                                            fontSize: '10px',
                                            background: '#22c55e20',
                                            color: '#22c55e',
                                            padding: '2px 5px',
                                            borderRadius: '6px',
                                            fontWeight: 600
                                        }}>
                                            {p.contacts.length}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div style={{ marginTop: '10px', color: '#fff' }}>
                    Total: {formatTime(totalWorkingHours?.total)}
                </div>
            </div>

            {/* 🔥 POPUP */}
       {selectedPunch && (
  <div
    onClick={() => setSelectedPunch(null)}
    style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: 16,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: '#fff', borderRadius: 16, width: 340,
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px', borderBottom: '0.5px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: '#FEF3C7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16 }}>🚶</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Field Meetings</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {selectedPunch.contacts?.length || 0} contacts recorded
          </div>
        </div>
        <button
          onClick={() => setSelectedPunch(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 4,
          }}
        >✕</button>
      </div>

      {/* Contacts */}
      <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {selectedPunch.contacts?.map((c: any, i: number) => {
          const initials = c.personName
            ?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
          const isSuccess = c.status === 'SUCCESS'

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', background: '#f8fafc',
              borderRadius: 8, border: '0.5px solid #e2e8f0',
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: '#dbeafe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 500, color: '#1d4ed8', flexShrink: 0,
              }}>
                {initials}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: '#0f172a',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {c.personName}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{c.contact}</div>

              </div>

              {/* Status badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 99, flexShrink: 0,
                background: isSuccess ? '#f0fdf4' : '#fef2f2',
                border: `0.5px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: isSuccess ? '#15803d' : '#dc2626' }}>
                  {isSuccess ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
              
            </div>
          )
        })}
      </div>

      {/* Remarks */}
    {/* 🔥 Common Remarks (from contacts) */}
{selectedPunch?.contacts?.some((c: any) => c.remarks) && (
  <div style={{
    margin: '0 18px 12px',
    padding: '10px 12px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '0.5px solid #e2e8f0'
  }}>
    <div style={{
      fontSize: 11,
      color: '#94a3b8',
      fontWeight: 500,
      marginBottom: 4,
      textTransform: 'uppercase'
    }}>
      Remarks
    </div>

    <div style={{
      fontSize: 13,
      color: '#0f172a'
    }}>
      {selectedPunch.contacts
        .map((c: any) => c.remarks)
        .filter(Boolean)
        .join(', ')}
    </div>
  </div>
)}

      {/* Footer — success/fail summary + close */}
      <div style={{
        padding: '12px 18px', borderTop: '0.5px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {selectedPunch.contacts?.filter((c: any) => c.status === 'SUCCESS').length} success
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {selectedPunch.contacts?.filter((c: any) => c.status === 'FAIL').length} failed
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedPunch(null)}
          style={{
            padding: '7px 16px', border: '0.5px solid #e2e8f0', borderRadius: 8,
            background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
        </div>
    )
}

const FieldPunchOutModal: React.FC<{
    onClose: () => void
    onSubmit: (contacts: ContactEntry[], remarks: string) => void
}> = ({ onClose, onSubmit }) => {
    const [contacts, setContacts] = useState<ContactEntry[]>([
        { personName: '', contact: '', status: 'SUCCESS' },
    ])
    const [remarks, setRemarks] = useState('')

    const addContact = () =>
        setContacts(prev => [...prev, { personName: '', contact: '', status: 'SUCCESS' }])

    const removeContact = (i: number) =>
        setContacts(prev => prev.filter((_, idx) => idx !== i))

    const updateContact = (i: number, field: keyof ContactEntry, value: string) =>
        setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))

    const handleSubmit = () => {
        if (contacts.some(c => !c.personName.trim() || !c.contact.trim())) {
            alert('Please fill name and contact for all entries')
            return
        }
        onSubmit(contacts, remarks)
    }

    const inp: React.CSSProperties = {
        flex: 1, border: '0.5px solid #e2e8f0', borderRadius: 8,
        padding: '7px 10px', fontSize: 13, background: '#f8fafc',
        color: '#1e293b', outline: 'none', minWidth: 0,
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}
            onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 16,
                padding: 20, width: 420, maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: 'inherit'
            }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: '#FEF3C7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <span style={{ fontSize: 16 }}>🚶</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: '#0f172a' }}>Field Punch Out</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Add everyone you met</div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 4
                    }}>✕</button>
                </div>

                {/* Contacts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                    {contacts.map((c, i) => (
                        <div key={i} style={{
                            background: '#f8fafc', border: '0.5px solid #e2e8f0',
                            borderRadius: 8, padding: '10px 12px'
                        }}>

                            {/* Label row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%', background: '#dbeafe',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 500, color: '#1d4ed8', flexShrink: 0
                                }}>{i + 1}</div>
                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Person {i + 1}</span>
                                {contacts.length > 1 && (
                                    <button onClick={() => removeContact(i)} style={{
                                        marginLeft: 'auto',
                                        background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444',
                                        display: 'flex', alignItems: 'center', padding: 0
                                    }}>✕</button>
                                )}
                            </div>

                            {/* Name + Contact */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <input placeholder="Full name *" value={c.personName}
                                    onChange={e => updateContact(i, 'personName', e.target.value)} style={inp} />
                                <input placeholder="Contact *" value={c.contact}
                                    onChange={e => updateContact(i, 'contact', e.target.value)} style={inp} />
                            </div>

                            {/* Status toggle */}
                            <div style={{ display: 'flex', gap: 6 }}>
                                {(['SUCCESS', 'FAIL'] as const).map(s => {
                                    const active = c.status === s
                                    const color = s === 'SUCCESS'
                                        ? { border: '#16a34a', bg: '#f0fdf4', text: '#15803d' }
                                        : { border: '#dc2626', bg: '#fef2f2', text: '#dc2626' }
                                    return (
                                        <button key={s} onClick={() => updateContact(i, 'status', s)}
                                            style={{
                                                flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12,
                                                fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                                                border: active ? `1.5px solid ${color.border}` : '0.5px solid #e2e8f0',
                                                background: active ? color.bg : '#fff',
                                                color: active ? color.text : '#94a3b8',
                                            }}>
                                            {s === 'SUCCESS' ? '✓ Success' : '✗ Failed'}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add more */}
                <button onClick={addContact} style={{
                    width: '100%', padding: 8, marginBottom: 12,
                    border: '1px dashed #cbd5e1', borderRadius: 8, background: 'transparent',
                    color: '#64748b', fontSize: 13, cursor: 'pointer'
                }}>
                    + Add another person
                </button>

                {/* Remarks */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>
                        Remarks (optional)
                    </div>
                    <textarea placeholder="Meeting notes, purpose, outcome..." value={remarks}
                        onChange={e => setRemarks(e.target.value)} rows={2}
                        style={{
                            width: '100%', border: '0.5px solid #e2e8f0', borderRadius: 8,
                            padding: '8px 10px', fontSize: 13, resize: 'none', background: '#f8fafc',
                            color: '#1e293b', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                        }} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '8px 16px', border: '0.5px solid #e2e8f0',
                        borderRadius: 8, background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer'
                    }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} style={{
                        padding: '8px 20px', border: 'none', borderRadius: 8,
                        background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                    }}>
                        Submit & Punch Out
                    </button>
                </div>
            </div>
        </div>
    )
}

const PunchInOut: React.FC<PunchInOutProps & { isMinimalView?: boolean }> = ({
    selectedDate,
    selectedEmployeeId,
    disablePunch,
    isMinimalView = false
}) => {
    const user = typeof window !== 'undefined' ? localStorage?.getItem('user') : null
    const { company_id } = user ? JSON.parse(user) : {}
    const dispatch = useDispatch()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const [punchState, setPunchState] = useState({
        isPunchIn: false,
        startTime: '',
        endTime: '',
        totalTime: '00h 00m 00s',
        isPunchOutDisabled: false,
        isPunchInDisabled: false
    })

    const { navigateToProfile } = useRouterWithMount()

    const [timer, setTimer] = useState('00h 00m 00s')
    const [currentPunchIndex, setCurrentPunchIndex] = useState(0)
    const [currentDateTime, setCurrentDateTime] = useState(new Date())
    const [isLargeScreen, setIsLargeScreen] = useState(false)
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [logoUrl, setLogoUrl] = useState('/images/logos/fintech.png');
    const [isSmallScreen, setIsSmallScreen] = useState(false)
    const [showHoursModal, setShowHoursModal] = useState(false)

    const employee = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = selectedEmployeeId || employee?.id;
    const userRole = employee?.role
    const userDesg = employee?.designation
    const totalWorkingHours = useSelector((state: RootState) => state.punches.totalWorkingHours)
    const punch = useSelector((state: RootState) => state.punches.punches)
    const loading = useSelector((state: RootState) => state.punches.loading)
    const error = useSelector((state: RootState) => state.punches.error)
    const [userData, setUserData] = useState(null)
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    const [punchType, setPunchType] = useState<'HOME' | 'OFFICE' | 'FIELD'>('OFFICE');
    const [showFieldModal, setShowFieldModal] = useState(false);
 

    const { settings } = useSettings()
    const router = useRouter()
    const isWhitelistedUser = WHITELIST_EMPLOYEE_IDS.includes(employeeId);

    const detectMobileDevice = () => {
        if (typeof navigator === "undefined" || typeof window === "undefined") return false;
        if (isWhitelistedUser) return false;
        const ua = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
        const isTablet = /ipad|tablet|playbook|silk/i.test(ua) || (ua.includes('android') && !ua.includes('mobile'));
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
        const isMobilePlatform = /android|iphone|ipad|ipod|windows phone/i.test(navigator.platform || '');
        const isAppleDevice = /apple/i.test(navigator.vendor || '');
        const isIOSDevice = isAppleDevice && isTouchDevice;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const smallPhysicalScreen = Math.min(screenWidth, screenHeight) <= 768;
        const lowMemoryDevice = (navigator as any).deviceMemory ? (navigator as any).deviceMemory <= 4 : false;
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        const isMobileConnection = connection?.type ? /cellular|wimax/i.test(connection.type) : false;
        if (isTouchDevice && smallPhysicalScreen) return true;
        if (isIOSDevice) return true;
        if (isMobileUA || isTablet) return true;
        if (isMobilePlatform) return true;
        if (isTouchDevice && (lowMemoryDevice || isMobileConnection)) return true;
        return false;
    };

    useEffect(() => {
        const checkDevice = () => {
            const isMobile = detectMobileDevice();
            setIsMobileDevice(isMobile);
        };
        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, [isWhitelistedUser, employeeId]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${user.id}`)
                const data = await response.json()
                setUserData(data)
            } catch (error) {
                console.error('Error fetching user data:', error)
            }
        }
        if (user.id) fetchUserData()
    }, [])

    const currentDate = new Date().toISOString().split('T')[0]
    const isCurrentDate = selectedDate === currentDate

    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 1024)
            setIsSmallScreen(window.innerWidth < 640)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const timerInterval = setInterval(() => setCurrentDateTime(new Date()), 1000)
        return () => clearInterval(timerInterval)
    }, [])

    useEffect(() => {
        const getConfiguration = async () => {
            try {
                const config = await fetchConfiguration();
                if (config.image) setLogoUrl(config.image);
            } catch (error) {
                console.error('Error fetching configuration:', error);
            }
        };
        getConfiguration();
    }, []);

    useEffect(() => {
        if (employeeId && selectedDate) {
            dispatch(fetchPunchByEmployeeAndDate({ employeeId, date: selectedDate }))
                .unwrap()
                .then(punchData => {
                    if (punchData.length > 0) {
                        const latestPunch = punchData[punchData.length - 1]
                        stopPunchTimer()
                        if (!latestPunch.punchOut) {
                            const punchInTimestamp = new Date(`${selectedDate} ${latestPunch.punchIn}`).getTime()
                            setPunchState({ ...punchState, isPunchIn: true, startTime: latestPunch.punchIn, isPunchInDisabled: true, isPunchOutDisabled: false })
                            setStartTimestamp(punchInTimestamp)
                            if (!selectedEmployeeId || isCurrentDate) {
                                startPunchInTimer(punchInTimestamp)
                            } else {
                                setTimer(latestPunch.totalTime || '00h 00m 00s')
                            }
                        } else {
                            setPunchState({ ...punchState, isPunchIn: false, startTime: latestPunch.punchIn, endTime: latestPunch.punchOut, isPunchInDisabled: false, isPunchOutDisabled: true })
                        }
                    } else {
                        setPunchState({ isPunchIn: false, startTime: '', endTime: '', totalTime: '00h 00m 00s', isPunchInDisabled: false, isPunchOutDisabled: true })
                        setTimer('00h 00m 00s')
                        setStartTimestamp(null)
                    }
                })
            dispatch(fetchTotalWorkingHours({ employeeId, date: selectedDate }))
        }
    }, [dispatch, employeeId, selectedDate, isCurrentDate])

    useEffect(() => {
        return () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
        }
    }, [employeeId])

    const startPunchInTimer = (timestamp: number) => {
        intervalRef.current = setInterval(() => {
            const diff = Date.now() - timestamp
            const totalSeconds = Math.floor(diff / 1000)
            const hours = Math.floor(totalSeconds / 3600)
            const minutes = Math.floor((totalSeconds % 3600) / 60)
            const seconds = totalSeconds % 60
            setTimer(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`)
        }, 1000)
    }

    const stopPunchTimer = () => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }

    const handlePunchIn = async () => {
        if (isMobileDevice && !isWhitelistedUser) {
            alert('🚫 PUNCH IN BLOCKED\n\n❌ Mobile/Tablet devices are not allowed for Punch In.\n✅ Use a Laptop or Desktop computer.\n\n📱 If you believe this is an error, contact your administrator.');
            return;
        }
        const now = new Date()
        const startTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const punchData = { punchIn: startTime, punchOut: '', totalTime: '00h 00m 00s', type: punchType, date: currentDate, employee: employeeId, company_id: company_id }
        setPunchState({ ...punchState, isPunchIn: true, startTime, isPunchInDisabled: true, isPunchOutDisabled: false })
        await dispatch(addPunch(punchData)).unwrap();
        startPunchInTimer(now.getTime())
    }

    const handlePunchOut = async () => {
        if (isMobileDevice && !isWhitelistedUser) {
            alert('🚫 PUNCH OUT BLOCKED...');
            return;
        }

        const latestPunch = punch?.length ? punch[punch.length - 1] : null;

      

        if (latestPunch?.type?.toUpperCase() === 'FIELD') {
            setShowFieldModal(true);
            return;
        }

        const now = new Date()
        const endTime = now.toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        })

        const confirmation = window.confirm('Are you sure you want to punch out?')
        if (!confirmation) return

        stopPunchTimer()

        setPunchState({
            isPunchIn: false, startTime: '', endTime, totalTime: timer,
            isPunchInDisabled: false, isPunchOutDisabled: true
        })

        await dispatch(updatePunch({ employeeId, punchData: { punchOut: endTime } })).unwrap()

        dispatch(fetchPunchByEmployeeAndDate({ employeeId, date: selectedDate }))
        dispatch(fetchTotalWorkingHours({ employeeId, date: selectedDate }))
    }

    const handleFieldSubmit = async (contacts: ContactEntry[], remarks: string) => {
        const now = new Date();
        const endTime = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        stopPunchTimer();

        const punchData = {
            punchOut: endTime,
            contacts: contacts.map(c => ({
                ...c,
                remarks
            }))
        };

        await dispatch(updatePunch({ employeeId, punchData })).unwrap();

        setShowFieldModal(false);

        setPunchState(prev => ({
            ...prev,
            isPunchIn: false,
            isPunchOutDisabled: true
        }));

        dispatch(fetchPunchByEmployeeAndDate({ employeeId, date: selectedDate }));
    };

    useEffect(() => {
        if (punch.length > 0) {
            const latestPunch = punch[punch.length - 1];
            if (!latestPunch.punchOut) {
                setPunchState(prev => ({
                    ...prev, isPunchIn: true, startTime: latestPunch.punchIn,
                    isPunchInDisabled: true, isPunchOutDisabled: false
                }));
            } else {
                setPunchState(prev => ({
                    ...prev, isPunchIn: false, startTime: latestPunch.punchIn,
                    endTime: latestPunch.punchOut, isPunchInDisabled: false, isPunchOutDisabled: true
                }));
            }
        }
    }, [punch]);

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [])

    const handlePreviousPunch = () => { if (currentPunchIndex > 0) setCurrentPunchIndex(currentPunchIndex - 1) }
    const handleNextPunch = () => { if (currentPunchIndex < punch.length - 1) setCurrentPunchIndex(currentPunchIndex + 1) }

    if (loading) {
        return <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    }

    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">Error: {error}</div>
    }

    const currentPunch = punch.length > 0 ? punch[currentPunchIndex] : null
    const isPunchDisabledDueToMobile = isMobileDevice && !isWhitelistedUser;

    // ─── Minimal View ──────────────────────────────────────────────────────────
    if (isMinimalView) {
        const punchInTime = punchState.startTime ? new Date(`1970-01-01T${punchState.startTime}`) : null;
        const referenceTime9AM = new Date('1970-01-01T09:00:00');
        const referenceTime10_15AM = new Date('1970-01-01T10:15:00');
        let punchMessage = '';
        if (punchInTime) {
            if (punchInTime <= referenceTime10_15AM && punchInTime >= referenceTime9AM) {
                punchMessage = 'Big achievements are often the result of small habits like punctuality practiced every single⏰🚀';
            } else if (punchInTime > referenceTime10_15AM) {
                punchMessage = `⏰Punctuality is not just about being on time; it's about respecting your work, your team, and your commitments.`;
            }
        }

        return (

            <>
               
                {showFieldModal && (
                    <FieldPunchOutModal
                        onClose={() => setShowFieldModal(false)}
                        onSubmit={handleFieldSubmit}
                    />
                )}

                {/* Working Hours Modal */}
                {showHoursModal && (
                    <WorkingHoursModal
                        totalWorkingHours={totalWorkingHours}
                        selectedDate={selectedDate}
                        onClose={() => setShowHoursModal(false)}
                        punch={punch}
                    />
                )}

                <div className={`flex flex-col items-center justify-center gap-2 p-2 rounded-xl shadow-lg mt-4 mx-auto ${settings.mode === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-900 to-blue-700'}`}>
                    {isPunchDisabledDueToMobile && (
                        <div className="text-center font-bold text-red-300 bg-red-900/40 p-1 rounded-lg w-full mb-2 border border-red-500">
                            🚫 Mobile devices cannot Punch In/Out. Use Desktop/Laptop.
                        </div>
                    )}

                    {punchMessage && (
                        <div className="text-center font-bold text-yellow-300 bg-black/20 p-3 rounded-lg w-full mb-9">
                            {punchMessage}
                        </div>
                    )}

                    <div className="flex items-center gap-3 w-full">
                        <div className="relative group cursor-pointer" onClick={() => navigateToProfile(userData?._id)}>
                            <img
                                alt={userData?.first_name || 'User'}
                                src={userData?.image || '/images/avatars/default.png'}
                                className="w-14 h-14 rounded-full border-2 border-white/70 object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-blue-500 text-white text-xs py-0.5 px-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                View Profile
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                                {userData?.first_name} {userData?.last_name}
                            </p>
                            <p className="text-white/60 text-xs truncate">{userDesg || 'Not Found'}</p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); router.push('/breaksheets') }}
                                className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-medium whitespace-nowrap"
                            >
                                Take Break
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); router.push('/queries') }}
                                className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium whitespace-nowrap"
                            >
                                Raise Query
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/15" />

                    <button
                        onClick={() => setShowHoursModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px', padding: '7px 16px', color: '#fff',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            width: '100%', justifyContent: 'center',
                            letterSpacing: '0.03em', transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        View Working Hours
                        <span style={{ marginLeft: '2px', opacity: 0.7, fontSize: '11px' }}>
                            {formatTime(totalWorkingHours?.total)}
                        </span>
                    </button>

                    <h2 className="font-bold text-center mb-9 text-white text-xl">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </h2>

                    <div className="flex gap-2 mb-2 justify-center">
                        {['HOME', 'OFFICE', 'FIELD'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setPunchType(t as any)}
                                disabled={punchState.isPunchIn}
                                className={`px-3 py-1 rounded text-xs font-medium ${punchType === t ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'} ${punchState.isPunchIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-around items-center w-full gap-4">
                        <div className="text-center">
                            <button
                                onClick={handlePunchIn}
                                disabled={punchState.isPunchInDisabled || disablePunch || isPunchDisabledDueToMobile}
                                className={`mb-2 px-4 py-2 rounded-lg ${punchState.isPunchInDisabled || disablePunch || isPunchDisabledDueToMobile ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                title={isPunchDisabledDueToMobile ? "Mobile devices not allowed. Use Desktop/Laptop." : ""}
                            >
                                Punch In
                            </button>
                            {punchState.startTime && <div className="text-sm text-white">{punchState.startTime}</div>}
                        </div>

                        <div className="text-white font-bold text-sm text-center">
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handlePunchOut}
                                disabled={punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile}
                                className={`mb-2 px-4 py-2 rounded-lg ${punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={isPunchDisabledDueToMobile ? "Mobile devices not allowed. Use Desktop/Laptop." : ""}
                            >
                                Punch Out
                            </button>
                            {punchState.endTime && <div className="text-sm text-white">{punchState.endTime}</div>}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ─── Full View ─────────────────────────────────────────────────────────────
    return (
        <>
            {/* Field Punch Out Modal */}
            {showFieldModal && (
                <FieldPunchOutModal
                    onClose={() => setShowFieldModal(false)}
                    onSubmit={handleFieldSubmit}
                />
            )}
            {showHoursModal && (
                <WorkingHoursModal
                    totalWorkingHours={totalWorkingHours}
                    selectedDate={selectedDate}
                    onClose={() => setShowHoursModal(false)}
                    punch={punch}
                />
            )}

            <div className="max-w-6xl mx-auto py-4">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    {isPunchDisabledDueToMobile && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-center">
                            <p className="font-bold">🚫 Mobile Device Detected</p>
                            <p className="text-sm">Punch In/Out is only allowed from Desktop or Laptop computers.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Clock */}
                        <div className="bg-gray-100 flex flex-col items-center justify-center p-8">
                            <div className="relative w-32 h-32 rounded-full border border-gray-300 bg-white shadow-md">
                                <div className="absolute w-1 h-10 bg-black top-1/2 left-1/2 transform -translate-x-1/2 origin-bottom transition-transform duration-100"
                                    style={{ transform: `translateY(-100%) rotate(${(currentDateTime.getHours() % 12) * 30 + currentDateTime.getMinutes() / 2}deg)` }} />
                                <div className="absolute w-0.5 h-14 bg-black top-1/2 left-1/2 transform -translate-x-1/2 origin-bottom transition-transform duration-100"
                                    style={{ transform: `translateY(-100%) rotate(${currentDateTime.getMinutes() * 6}deg)` }} />
                                <div className="absolute w-0.5 h-16 bg-red-500 top-1/2 left-1/2 transform -translate-x-1/2 origin-bottom transition-transform duration-100"
                                    style={{ transform: `translateY(-100%) rotate(${currentDateTime.getSeconds() * 6}deg)` }} />
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full overflow-hidden opacity-60">
                                    <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                                </div>
                                {Array.from({ length: 12 }).map((_, index) => {
                                    const angle = (index + 1) * 30
                                    const x = 50 + 38 * Math.cos((angle - 90) * (Math.PI / 180))
                                    const y = 50 + 38 * Math.sin((angle - 90) * (Math.PI / 180))
                                    return (
                                        <div key={index} className="absolute font-bold text-sm"
                                            style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)' }}>
                                            {index + 1}
                                        </div>
                                    )
                                })}
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-800">
                                {currentDateTime.toLocaleDateString('en-US', { weekday: 'long' })}
                            </h3>
                            <h3 className="mt-2 text-xl font-semibold text-gray-800">
                                {currentDateTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                        </div>

                        {/* Punch buttons */}
                        <div className="bg-blue-50 flex flex-col items-center justify-center p-8">
                            <div className="text-blue-600 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-600 mb-4">Daily Check In/Out</h2>

                            {punchState.isPunchIn && (
                                <div className="text-3xl font-bold text-blue-600 mb-4">{timer}</div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={handlePunchIn}
                                    disabled={punchState.isPunchInDisabled || disablePunch || !isCurrentDate || isPunchDisabledDueToMobile}
                                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${punchState.isPunchInDisabled || disablePunch || !isCurrentDate || isPunchDisabledDueToMobile
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                    title={
                                        isPunchDisabledDueToMobile ? "Mobile devices not allowed. Use Desktop/Laptop."
                                            : disablePunch ? "Managers can't punch in for team members."
                                                : !isCurrentDate ? "Punch-In available for today only." : ''
                                    }
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                    Punch In
                                </button>

                                <button
                                    onClick={handlePunchOut}
                                    disabled={punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile}
                                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                        }`}
                                    title={
                                        isPunchDisabledDueToMobile ? "Mobile devices not allowed. Use Desktop/Laptop."
                                            : disablePunch ? "Managers can't punch out for team members." : ''
                                    }
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                    </svg>
                                    Punch Out
                                </button>
                            </div>
                        </div>

                        {/* Attendance Logs */}
                        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-8 border-t border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">Attendance Logs</h2>
                            <div className="grid grid-cols-3 gap-4 w-full mb-6 text-center">
                                <div className="flex flex-col">
                                    <h4 className="font-semibold text-gray-700 mb-2">Punch In</h4>
                                    <div className="text-gray-600">{currentPunch?.punchIn || '-'}</div>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="font-semibold text-gray-700 mb-2">Punch Out</h4>
                                    <div className="text-gray-600">{currentPunch?.punchOut || '-'}</div>
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="font-semibold text-gray-700 mb-2">Total Time</h4>
                                    <div className="text-gray-600">{currentPunch?.totalTime || '-'}</div>

                                </div>

                            </div>
                            <div className="flex gap-4">
                                <button onClick={handlePreviousPunch} disabled={currentPunchIndex === 0}
                                    className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${currentPunchIndex === 0 ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-blue-500 text-blue-500 hover:bg-blue-50'}`}>
                                    Previous
                                </button>
                                <button onClick={handleNextPunch} disabled={currentPunchIndex === punch.length - 1}
                                    className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${currentPunchIndex === punch.length - 1 ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-blue-500 text-blue-500 hover:bg-blue-50'}`}>
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Total bar */}
                    <div className="bg-[#1a237e] p-6 text-center">
                        <h3 className="text-gray-200 text-lg font-semibold mb-2">
                            Total Working Hours of {selectedDate}
                        </h3>
                        <div className="text-2xl font-bold text-blue-400 mb-4">
                            {`${totalWorkingHours?.total?.h || 0}h ${totalWorkingHours?.total?.m || 0}m ${totalWorkingHours?.total?.s || 0}s`}
                        </div>
                        <button
                            onClick={() => setShowHoursModal(true)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                                borderRadius: '10px', padding: '8px 20px', color: '#fff',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.03em',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                            View Breakdown (Home / Office / Field)
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PunchInOut
