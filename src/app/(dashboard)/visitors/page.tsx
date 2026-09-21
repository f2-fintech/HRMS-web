'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IBM_Plex_Mono, Inter, Playfair_Display } from 'next/font/google'

import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ---- Design tokens -----------------------------------------------------
// Soft sky-blue reception-ledger palette — light, airy, and calm instead
// of the previous ink/brass combo. See design notes at the end of the file.
const ink = '#1E3A5F'
const inkSoft = '#3D5A80'
const paper = '#EEF5FC'
const surface = '#FFFFFF'
const accent = '#4A90D9'
const accentDark = '#2F6FB3'
const rule = '#DCE8F5'
const textMuted = '#6B7280'
const danger = '#B3413B'

const display = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'], style: ['normal'], display: 'swap' })
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap' })

type Visitor = {
    _id: string
    name: string
    contact: string
    email?: string
    vendorType: string
    otherVendorType?: string
    questions?: string
    whomToMeet?: string
    description?: string
    createdAt?: string
    companyName?: string
    purposeOfVisit?: string
    designation?: string
    meetingType?: string
    selfieUrl?: string
    inTime?: string
    outTime?: string
}

type VisitorForm = {
    name: string
    contact: string
    email: string
    vendorType: string
    otherVendorType: string
    questions: string
    whomToMeet: string
    description: string
    companyName: string
    purposeOfVisit: string
    designation: string
    meetingType: string
    inTime?: string
    outTime?: string
    selfie: File | null
}

const emptyForm: VisitorForm = {
    name: '',
    contact: '',
    email: '',
    vendorType: '',
    otherVendorType: '',
    questions: '',
    whomToMeet: '',
    description: '',
    companyName: '',
    purposeOfVisit: '',
    designation: '',
    meetingType: '',
    inTime: '',
    outTime: '',
    selfie: null
}

const VENDOR_TYPES = ['Guest', 'Banker', 'DSA', 'Channel Partner', 'Candidate', 'Vendor', 'Contractor', 'Interview', 'Client', 'Delivery', 'Other']

const ADMIN_ROLES = ['0', '1', '6']

const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500'

const getResponseRows = (payload: any): Visitor[] => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.visitors)) return payload.visitors
    if (Array.isArray(payload?.data?.visitors)) return payload.data.visitors
    if (Array.isArray(payload?.items)) return payload.items
    if (Array.isArray(payload?.result)) return payload.result
    if (payload?.data && typeof payload.data === 'object' && payload.data._id) return [payload.data]
    if (payload?.visitor && typeof payload.visitor === 'object') return [payload.visitor]
    if (payload?._id) return [payload]

    return []
}

const VisitorsPage = () => {
    const [user, setUser] = useState<any>({})
    const [token, setToken] = useState<string | null>(null)
    const [visitors, setVisitors] = useState<Visitor[]>([])
    const [form, setForm] = useState<VisitorForm>(emptyForm)
    const [search, setSearch] = useState('')
    const [date, setDate] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [addOpen, setAddOpen] = useState(false)
    const [editVisitor, setEditVisitor] = useState<Visitor | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [cameraOpen, setCameraOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const isAdmin = ADMIN_ROLES.includes(String(user?.role))

    // localStorage only exists in the browser, so it must be read inside an
    // effect (not during render) to avoid crashing on the server-rendered pass.
    useEffect(() => {
        try {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'))
        } catch {
            setUser({})
        }

        setToken(localStorage.getItem('token'))
    }, [])

    const requestHeaders = useMemo(
        () => ({
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(user?.company_id ? { 'x-company-id': String(user.company_id) } : {})
        }),
        [token, user?.company_id]
    )
    const loadVisitors = useCallback(
        async (keyword?: string) => {
            setLoading(true)
            setError('')

            try {
                const params = new URLSearchParams()

                if (keyword) {
                    params.append('keyword', keyword)
                }

                // Employees only see their own visitors
                if (!isAdmin) {
                    const userId = user?._id || user?.id

                    if (userId) {
                        params.append('createdBy', String(userId))
                    }
                }

                const query = params.toString() ? `?${params.toString()}` : ''

                const response = await fetch(
                    `${apiUrl}/visitors/get-visitors${query}`,
                    {
                        headers: requestHeaders
                    }
                )

                const payload = await response.json().catch(() => ({}))

                if (!response.ok) {
                    throw new Error(
                        payload?.message || 'Unable to load visitors'
                    )
                }

                setVisitors(getResponseRows(payload))
            } catch (requestError: any) {
                setError(
                    requestError?.message ||
                    'Unable to load visitors'
                )
            } finally {
                setLoading(false)
            }
        },
        [
            isAdmin,
            user?._id,
            user?.id,
            requestHeaders
        ]
    )
    useEffect(() => {
        if (user?.role !== undefined && token) {
            loadVisitors()
        }
    }, [
        isAdmin,
        user?.company_id,
        user?.role,
        user?._id,
        user?.id,
        token,
        loadVisitors
    ])
    // Debounced server-side keyword search for the current user's scope.
    useEffect(() => {
        if (user?.role === undefined || !token) return

        const handle = setTimeout(() => loadVisitors(search.trim() || undefined), 400)

        return () => clearTimeout(handle)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, token, user?.role, loadVisitors])

    const updateForm = (field: keyof VisitorForm, value: string) => {
        setForm(current => ({ ...current, [field]: value }))
    }

    const openAdd = () => {
        setForm(emptyForm)
        setAddOpen(true)
    }

    const closeAdd = () => {
        if (submitting) return
        setAddOpen(false)
        setForm(emptyForm)
    }

    const closeEdit = () => {
        if (submitting) return
        setEditVisitor(null)
        setForm(emptyForm)
    }

    const submitVisitor = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setSubmitting(true)

        try {
            const formData = new FormData()
            Object.entries(form).forEach(([key, value]) => {
                if (key === 'selfie') {
                    if (value) formData.append(key, value as File)
                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value))
                }
            })
            if (user?.company_id) formData.append('company_id', user.company_id)
            if (user?._id || user?.id) formData.append('createdBy', user._id || user.id)

            const { 'Content-Type': _, ...headers } = requestHeaders as any

            const response = await fetch(`${apiUrl}/visitors/create-visitors`, {
                method: 'POST',
                headers: headers,
                body: formData
            })
            const payload = await response.json().catch(() => ({}))

            if (!response.ok) throw new Error(payload?.message || 'Unable to save visitor')

            toast.success('Visitors added successfully')
            closeAdd()
            // A new entry must not stay hidden behind an old search term.
            setSearch('')
            await loadVisitors()
        } catch (requestError: any) {
            toast.error(requestError?.message || 'Unable to save visitor')
        } finally {
            setSubmitting(false)
        }
    }

    const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!editVisitor?._id) return

        setSubmitting(true)

        try {
            const formData = new FormData()
            Object.entries(form).forEach(([key, value]) => {
                if (key === 'selfie') {
                    if (value) formData.append(key, value as File)
                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value))
                }
            })

            const { 'Content-Type': _, ...headers } = requestHeaders as any

            const response = await fetch(`${apiUrl}/visitors/update-visitors/${editVisitor._id}`, {
                method: 'PATCH',
                headers: headers,
                body: formData
            })
            const payload = await response.json().catch(() => ({}))

            if (!response.ok) throw new Error(payload?.message || 'Unable to update visitor')

            toast.success('Successfully updated..')
            closeEdit()
            await loadVisitors(search.trim() || undefined)
        } catch (requestError: any) {
            toast.error(requestError?.message || 'Unable to update visitor')
        } finally {
            setSubmitting(false)
        }
    }

    const deleteVisitor = async (id: string) => {
        if (!window.confirm('Do you want to delete this visitor?')) return

        setDeletingId(id)

        try {
            const response = await fetch(`${apiUrl}/visitors/${id}`, { method: 'DELETE', headers: requestHeaders })

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}))
                throw new Error(payload?.message || 'Unable to delete visitor')
            }

            toast.success('Visitor deleted successfully')
            setVisitors(current => current.filter(visitor => visitor._id !== id))
        } catch (requestError: any) {
            toast.error(requestError?.message || 'Unable to delete visitor')
        } finally {
            setDeletingId(null)
        }
    }

    const openEdit = (visitor: Visitor) => {
        setForm({
            name: visitor.name || '',
            contact: visitor.contact || '',
            email: visitor.email || '',
            vendorType: visitor.vendorType || '',
            otherVendorType: visitor.otherVendorType || '',
            questions: visitor.questions || '',
            whomToMeet: visitor.whomToMeet || '',
            description: visitor.description || '',
            companyName: visitor.companyName || '',
            purposeOfVisit: visitor.purposeOfVisit || '',
            designation: visitor.designation || '',
            meetingType: visitor.meetingType || '',
            selfie: null
        })
        setEditVisitor(visitor)
    }

    const markOut = async (visitor: Visitor) => {
        try {
            const formData = new FormData()
            formData.append('outTime', new Date().toISOString())

            const { 'Content-Type': _, ...headers } = requestHeaders as any

            const response = await fetch(`${apiUrl}/visitors/update-visitors/${visitor._id}`, {
                method: 'PATCH',
                headers: headers,
                body: formData
            })
            if (response.ok) {
                toast.success('Visitor marked out')
                loadVisitors()
            } else {
                toast.error('Failed to mark out')
            }
        } catch (error) {
            toast.error('Failed to mark out')
        }
    }

    const startCamera = async () => {
        setCameraOpen(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (err) {
            toast.error("Could not access camera")
            setCameraOpen(false)
        }
    }

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setCameraOpen(false)
    }, [])

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
                    setForm(current => ({ ...current, selfie: file }))
                    stopCamera()
                }
            }, 'image/jpeg')
        }
    }

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const filteredVisitors = useMemo(() => {
        if (!date) return visitors

        return visitors.filter(visitor => {
            if (!visitor.createdAt) return false

            const visitorDate = new Date(visitor.createdAt)

            if (Number.isNaN(visitorDate.getTime())) return false

            const pad = (n: number) => n.toString().padStart(2, '0')
            const day = `${visitorDate.getFullYear()}-${pad(visitorDate.getMonth() + 1)}-${pad(visitorDate.getDate())}`

            return day === date
        })
    }, [date, visitors])

    const columns: GridColDef<Visitor>[] = [
        {
            field: 'selfieUrl',
            headerName: 'Photo',
            width: 70,
            sortable: false,
            renderCell: params => params.value ? (
                <Avatar
                    src={params.value}
                    sx={{ width: 36, height: 36, mt: 0.5, cursor: 'pointer', border: `1px solid ${rule}` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(params.value);
                    }}
                />
            ) : '-'
        },
        { field: 'name', headerName: 'Name', flex: 1.1, minWidth: 150 },
        {
            field: 'contact',
            headerName: 'Contact',
            minWidth: 150,
            flex: 0.9,
            renderCell: params => <span style={{ fontFamily: mono.style.fontFamily, fontSize: '0.85rem' }}>{params.value}</span>
        },
        { field: 'email', headerName: 'Email', minWidth: 180, flex: 1.1, valueGetter: (_, row) => row.email || '-' },
        {
            field: 'vendorType',
            headerName: 'Visitor Category',
            minWidth: 140,
            flex: 0.8,
            renderCell: params => (
                <Chip
                    size='small'
                    label={params.value === 'Other' && params.row.otherVendorType ? `Other: ${params.row.otherVendorType}` : params.value || '-'}
                    variant='outlined'
                    sx={{ borderColor: accent, color: accentDark, fontWeight: 600, bgcolor: `${accent}14`, borderRadius: '999px' }}
                />
            )
        },
        // { field: 'questions', headerName: 'Questions', minWidth: 160, flex: 1, valueGetter: (_, row) => row.questions || '-' },
        { field: 'whomToMeet', headerName: 'Whom to Meet', minWidth: 150, flex: 1, valueGetter: (_, row) => row.whomToMeet || '-' },
        { field: 'companyName', headerName: 'Company/Org', minWidth: 150, flex: 1, valueGetter: (_, row) => row.companyName || '-' },
        { field: 'designation', headerName: 'Designation', minWidth: 130, flex: 0.9, valueGetter: (_, row) => row.designation || '-' },
        { field: 'purposeOfVisit', headerName: 'Purpose', minWidth: 140, flex: 1, valueGetter: (_, row) => row.purposeOfVisit || '-' },
        { field: 'meetingType', headerName: 'Type', minWidth: 120, flex: 0.7, valueGetter: (_, row) => row.meetingType || '-' },
        {
            field: 'createdAt',
            headerName: 'Date',
            minWidth: 110,
            flex: 0.8,
            valueGetter: (_, row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : '-'
        },
        {
            field: 'inTime',
            headerName: 'In Time',
            minWidth: 90,
            flex: 0.8,
            valueGetter: (_, row) => row.inTime ? new Date(row.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (row.createdAt ? new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-')
        },
        {
            field: 'outTime',
            headerName: 'Out Time',
            minWidth: 110,
            flex: 0.8,
            renderCell: params => {
                if (params.value) return new Date(params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => { e.stopPropagation(); markOut(params.row); }}
                        sx={{ textTransform: 'none', borderRadius: '6px', py: 0.2, minWidth: '70px', borderColor: accent, color: accentDark }}
                    >
                        Mark Out
                    </Button>
                )
            }
        },
        { field: 'description', headerName: 'Description', minWidth: 180, flex: 1.1, valueGetter: (_, row) => row.description || '-' },

        {
            field: 'actions',
            headerName: '',
            minWidth: isAdmin ? 96 : 48,
            sortable: false,
            filterable: false,
            renderCell: (params: any) => (
                <Stack direction='row' gap={0.5}>

                    {/* Edit - Admin + Specific Employee */}
                    {(isAdmin || user?.employeeId === '6a54bdac51196b767850dc37') && (
                        <Tooltip title='Edit'>
                            <IconButton
                                size='small'
                                onClick={() => openEdit(params.row)}
                            >
                                <EditIcon
                                    fontSize='small'
                                    sx={{ color: inkSoft }}
                                />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Delete - Admin only */}
                    {isAdmin && (
                        <Tooltip title='Delete'>
                            <IconButton
                                size='small'
                                disabled={deletingId === params.row._id}
                                onClick={() => deleteVisitor(params.row._id)}
                            >
                                {deletingId === params.row._id ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <DeleteIcon
                                        fontSize='small'
                                        sx={{ color: danger }}
                                    />
                                )}
                            </IconButton>
                        </Tooltip>
                    )}

                </Stack>
            )
        }


    ]

    const fieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent, borderWidth: '1.5px' }
        },
        '& .MuiInputLabel-root.Mui-focused': { color: accentDark }
    }

    const visitorFormFields = (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
                <TextField required fullWidth sx={fieldSx} label='Name' placeholder='Visitor name' value={form.name} onChange={event => updateForm('name', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField required fullWidth sx={fieldSx} label='Contact' placeholder='Phone number' value={form.contact} onChange={event => updateForm('contact', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField type='email' fullWidth sx={fieldSx} label='Email' placeholder='Optional' value={form.email} onChange={event => updateForm('email', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    select
                    required
                    fullWidth
                    sx={fieldSx}
                    label='Visitor Category'
                    value={form.vendorType}
                    onChange={event => {
                        const vendorType = event.target.value
                        updateForm('vendorType', vendorType)
                        if (vendorType !== 'Other') updateForm('otherVendorType', '')
                    }}
                >
                    {VENDOR_TYPES.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                </TextField>
            </Grid>
            {form.vendorType === 'Other' && (
                <Grid item xs={12} md={6}>
                    <TextField
                        required
                        fullWidth
                        sx={fieldSx}
                        label='Who is the visitor?'
                        placeholder='e.g. Consultant, partner, relative'
                        value={form.otherVendorType}
                        onChange={event => updateForm('otherVendorType', event.target.value)}
                    />
                </Grid>
            )}

            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    sx={fieldSx}
                    label='Whom to Meet'
                    placeholder='Person or employee name'
                    value={form.whomToMeet}
                    onChange={event => updateForm('whomToMeet', event.target.value)}
                />
            </Grid>

            <Grid item xs={12} md={6}>
                <TextField fullWidth sx={fieldSx} label='Company/Org Name' placeholder='Company Name' value={form.companyName} onChange={event => updateForm('companyName', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth sx={fieldSx} label='Designation' placeholder='Visitor Designation' value={form.designation} onChange={event => updateForm('designation', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField fullWidth sx={fieldSx} label='Purpose of Visit' placeholder='Purpose of Visit' value={form.purposeOfVisit} onChange={event => updateForm('purposeOfVisit', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    select
                    fullWidth
                    sx={fieldSx}
                    label='Meeting Type'
                    value={form.meetingType}
                    onChange={event => updateForm('meetingType', event.target.value)}
                >
                    <MenuItem value='Individual'>Individual</MenuItem>
                    <MenuItem value='Group'>Group</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems="center" sx={{ mb: 1 }}>
                    {(form.selfie || editVisitor?.selfieUrl) && (
                        <Avatar
                            src={form.selfie ? URL.createObjectURL(form.selfie as Blob) : editVisitor?.selfieUrl}
                            variant="rounded"
                            sx={{ width: 56, height: 56, border: `1px solid ${rule}`, cursor: 'pointer' }}
                            onClick={() => {
                                const url = form.selfie ? URL.createObjectURL(form.selfie as Blob) : editVisitor?.selfieUrl;
                                if (url) setPreviewImage(url);
                            }}
                        />
                    )}
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{
                            borderColor: accent,
                            color: accentDark,
                            textTransform: 'none',
                            borderRadius: '8px',
                            height: 56
                        }}
                    >
                        {form.selfie ? (form.selfie as File).name : 'Upload Selfie'}
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                    setForm(current => ({ ...current, selfie: e.target.files![0] }))
                                }
                            }}
                        />
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={startCamera}
                        sx={{
                            borderColor: accent,
                            color: accentDark,
                            textTransform: 'none',
                            borderRadius: '8px',
                            height: 56
                        }}
                    >
                        Take Selfie (Camera)
                    </Button>
                </Stack>
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth multiline minRows={2} sx={fieldSx} label='Description' placeholder='Additional notes(If Needed)' value={form.description} onChange={event => updateForm('description', event.target.value)} />
            </Grid>
        </Grid>
    )

    return (
        <Box
            className={body.className}
            sx={{
                p: { xs: 2, md: 4 },
                maxWidth: 1600,
                mx: 'auto',
                bgcolor: paper,
                minHeight: '100%',
                backgroundImage: `radial-gradient(circle at 100% 0%, ${accent}10 0, transparent 28rem)`,
                fontFamily: body.style.fontFamily,
                '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiMenuItem-root, & .MuiChip-root, & .MuiDataGrid-root':
                    { fontFamily: `${body.style.fontFamily} !important` }
            }}
        >
            <ToastContainer position='top-right' />

            {/* Masthead */}
            <Box
                sx={{
                    mb: 5,
                    p: { xs: 2.5, md: 4 },
                    borderRadius: '14px',
                    background: `linear-gradient(120deg, ${surface} 0%, #F7FBFF 68%, ${accent}10 100%)`,
                    border: `1px solid ${rule}`,
                    boxShadow: `0 14px 34px ${ink}0B`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:after': {
                        content: '""',
                        position: 'absolute',
                        width: 180,
                        height: 180,
                        borderRadius: '50%',
                        border: `22px solid ${accent}18`,
                        right: -54,
                        top: -86,
                        pointerEvents: 'none'
                    }
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ md: 'flex-end' }} gap={3}>
                    <Box>
                        <Typography
                            className={display.className}
                            sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '2.75rem' }, color: ink, letterSpacing: '-0.01em', lineHeight: 1.05 }}
                        >
                            Visitors
                        </Typography>

                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} gap={{ xs: 2, sm: 4 }} sx={{ position: 'relative' }}>
                        {visitors.length > 0 && (
                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, px: 2, py: 1, borderLeft: `3px solid ${accent}`, bgcolor: `${accent}0C`, borderRadius: '0 8px 8px 0' }}>
                                <Typography className={display.className} sx={{ fontWeight: 700, fontSize: '1.1rem', color: ink, lineHeight: 1 }}>
                                    {visitors.length}
                                </Typography>
                                <Typography variant='caption' sx={{ color: textMuted, whiteSpace: 'nowrap' }}>Total logged</Typography>
                            </Box>
                        )}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            gap={{ xs: 2, sm: 4 }}
                        >




                            <Button
                                variant="contained"
                                disableElevation
                                startIcon={<AddIcon />}
                                onClick={openAdd}
                                sx={{
                                    bgcolor: accent,
                                    color: '#fff',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2.75,
                                    py: 1.1,
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': {
                                        bgcolor: accentDark
                                    }
                                }}
                            >
                                Add visitor
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>

                <Box
                    sx={{
                        mt: 3,
                        height: '2px',
                        background: `linear-gradient(90deg, ${accent} 0%, ${accent}00 100%)`,
                    }}
                />            </Box>


            <Box component='section' sx={{ mb: 6, p: { xs: 2, md: 3 }, bgcolor: surface, border: `1px solid ${rule}`, borderRadius: '12px', boxShadow: `0 10px 26px ${ink}08` }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ sm: 'center' }} gap={2} sx={{ mb: 2.5 }}>
                    <Box>
                        <Typography className={display.className} sx={{ fontWeight: 700, fontSize: '1.4rem', color: ink }}>
                            {isAdmin ? 'All entries' : 'My visitor entries'}
                        </Typography>
                        <Typography variant='caption' sx={{ color: textMuted }}>{isAdmin ? 'Search, review and manage visitor records' : 'Visitors added by you'}</Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
                        <TextField
                            size='small'
                            placeholder='Search by name, contact, vendor…'
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            sx={{ minWidth: 260, ...fieldSx }}
                            InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' sx={{ color: textMuted }} /></InputAdornment> }}
                        />
                        <TextField
                            size='small'
                            type='date'
                            label='Date'
                            value={date}
                            onChange={event => setDate(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 165, ...fieldSx ,zIndex:0}}
                        />
                        {date && (
                            <Button
                                size='small'
                                onClick={() => setDate('')}
                                sx={{ minWidth: 70, color: accentDark, textTransform: 'none' }}
                            >
                                Clear date
                            </Button>
                        )}
                        <Tooltip title='Refresh'>
                            <IconButton onClick={() => loadVisitors(search.trim() || undefined)} sx={{ border: `1px solid ${rule}`, borderRadius: '8px' }}>
                                <RefreshIcon fontSize='small' sx={{ color: inkSoft }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                {error && <Alert severity='error' sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}

                <DataGrid
                    autoHeight
                    rows={filteredVisitors}
                    columns={columns}
                    getRowId={row => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    sx={{
                        border: 'none',
                        bgcolor: surface,
                        '& .MuiDataGrid-columnHeaders': { borderBottom: `1.5px solid ${ink}`, bgcolor: 'transparent' },
                        '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, color: ink },
                        '& .MuiDataGrid-cell': { borderColor: rule },
                        '& .MuiDataGrid-row:hover': { bgcolor: `${accent}0F` },
                        '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${rule}` }
                    }}
                />
            </Box>
            {/* Add visitor dialog - Admin + Employee */}
            <Dialog
                open={addOpen}
                onClose={closeAdd}
                fullWidth
                maxWidth='sm'
                PaperProps={{
                    sx: {
                        borderRadius: '14px',
                        borderTop: `4px solid ${accent}`,
                        boxShadow: `0 20px 60px ${ink}30`
                    }
                }}
            >
                <Box component='form' onSubmit={submitVisitor}>

                    <DialogTitle
                        className={display.className}
                        sx={{
                            fontWeight: 700,
                            color: ink
                        }}
                    >
                        Add visitor
                    </DialogTitle>

                    <DialogContent>
                        {visitorFormFields}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2.5 }}>

                        <Button
                            onClick={closeAdd}
                            disabled={submitting}
                            sx={{
                                textTransform: 'none',
                                color: textMuted
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            type='submit'
                            variant='contained'
                            disableElevation
                            disabled={submitting}
                            sx={{
                                bgcolor: accent,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '8px',
                                '&:hover': {
                                    bgcolor: accentDark
                                }
                            }}
                        >
                            {submitting ? (
                                <CircularProgress
                                    size={22}
                                    color='inherit'
                                />
                            ) : (
                                'Add visitor'
                            )}
                        </Button>

                    </DialogActions>

                </Box>
            </Dialog>

            {/* Edit visitor dialog - Admin + Employee */}
            <Dialog
                open={!!editVisitor}
                onClose={closeEdit}
                fullWidth
                maxWidth='sm'
                PaperProps={{
                    sx: {
                        borderRadius: '14px',
                        borderTop: `4px solid ${accent}`,
                        boxShadow: `0 20px 60px ${ink}30`
                    }
                }}
            >
                <Box component='form' onSubmit={submitEdit}>
                    <DialogTitle
                        className={display.className}
                        sx={{
                            fontWeight: 700,
                            color: ink
                        }}
                    >
                        Edit visitor
                    </DialogTitle>

                    <DialogContent>
                        {visitorFormFields}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button
                            onClick={closeEdit}
                            disabled={submitting}
                            sx={{
                                textTransform: 'none',
                                color: textMuted
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            type='submit'
                            variant='contained'
                            disableElevation
                            disabled={submitting}
                            sx={{
                                bgcolor: accent,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '8px',
                                '&:hover': {
                                    bgcolor: accentDark
                                }
                            }}
                        >
                            {submitting ? (
                                <CircularProgress
                                    size={22}
                                    color='inherit'
                                />
                            ) : (
                                'Save changes'
                            )}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Edit visitor dialog (admin only) */}
            {isAdmin && (
                <Dialog open={!!editVisitor} onClose={closeEdit} fullWidth maxWidth='sm' PaperProps={{ sx: { borderRadius: '14px', borderTop: `4px solid ${accent}`, boxShadow: `0 20px 60px ${ink}30` } }}>
                    <Box component='form' onSubmit={submitEdit}>
                        <DialogTitle className={display.className} sx={{ fontWeight: 700, color: ink }}>Edit visitor</DialogTitle>
                        <DialogContent>{visitorFormFields}</DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button onClick={closeEdit} disabled={submitting} sx={{ textTransform: 'none', color: textMuted }}>Cancel</Button>
                            <Button
                                type='submit'
                                variant='contained'
                                disableElevation
                                disabled={submitting}
                                sx={{ bgcolor: accent, textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: accentDark } }}
                            >
                                {submitting ? <CircularProgress size={22} color='inherit' /> : 'Save changes'}
                            </Button>
                        </DialogActions>
                    </Box>
                </Dialog>
            )}

            {/* Camera Capture Dialog */}
            <Dialog open={cameraOpen} onClose={stopCamera} fullWidth maxWidth='sm' PaperProps={{ sx: { borderRadius: '14px', borderTop: `4px solid ${accent}` } }}>
                <DialogTitle className={display.className} sx={{ fontWeight: 700, color: ink, textAlign: 'center' }}>Take a Selfie</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                        component="video"
                        ref={videoRef}
                        autoPlay
                        playsInline
                        sx={{
                            width: '100%',
                            maxWidth: 400,
                            borderRadius: '8px',
                            border: `1px solid ${rule}`,
                            backgroundColor: '#000',
                            transform: 'scaleX(-1)' // Mirror effect for front camera
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'center', gap: 2 }}>
                    <Button onClick={stopCamera} sx={{ textTransform: 'none', color: textMuted }}>Cancel</Button>
                    <Button onClick={capturePhoto} variant="contained" sx={{ bgcolor: accent, color: '#fff', textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: accentDark } }}>
                        Capture Photo
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '14px', bgcolor: 'transparent', boxShadow: 'none' } }}>
                <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                        onClick={() => setPreviewImage(null)}
                        sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {previewImage && (
                        <Box component="img" src={previewImage} sx={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '14px', objectFit: 'contain' }} />
                    )}
                </DialogContent>
            </Dialog>

        </Box>
    )
}

export default VisitorsPage
