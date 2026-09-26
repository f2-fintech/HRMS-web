"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_APP_URL });
function getDuration(start?: string, end?: string) {
    if (!start || !end) return null;

    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff <= 0) return null;

    const mins = Math.floor(diff / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
// ─── Types ────────────────────────────────────────────────────────────────────

type Row = {
    _id: string;
    date: string;
    createdAt?: string;
    employee_name: string;
    // tl_name: string;
    manager: string;
    login_poc?: string;

    // location_state?: string;
    customer_loan_id?: string;
    credit_eligibility?: string;
    credit_tat?: string;
    login_tat?: string;

    city?: string;
    lender?: string;
    loan_amount?: number;
    credit_poc?: string;
    ops_poc?: string;
    banker_details?: string;
    status?: "login" | "reject" | "approved" | "disbursed" | "hold" | "drop"
};


type FormData = Omit<Row, "_id" | "date">;

const EMPTY_FORM: FormData = {
    employee_name: "",
    // tl_name: "",
    manager: "",
    login_poc: "",
    customer_loan_id: "",
    // location_state: "",
    city: "",
    lender: "",
    loan_amount: 0,
    credit_poc: "",
    ops_poc: "",
    banker_details: "",
    credit_eligibility: "",
    status: "login",
};

const FIELDS: { key: keyof FormData; label: string; type?: string }[] = [
    { key: "employee_name", label: "Employee Name" },
    // { key: "tl_name", label: "TL Name" },
    { key: "manager", label: "Manager" },
    { key: "login_poc", label: "Login POC" },
    { key: "customer_loan_id", label: "Customer ID" },
    // { key: "location_state", label: "State" },
    { key: "city", label: "City" },
    { key: "lender", label: "Lender" },
    { key: "loan_amount", label: "Loan Amount", type: "number" },
    { key: "credit_poc", label: "Credit POC" },
    { key: "ops_poc", label: "Ops POC" },
    { key: "banker_details", label: "Banker Name & No" },
    { key: "credit_eligibility", label: "Credit Eligibility" },
];

const TABLE_COLS = [
    { label: "Case Received Time", key: "createdAt" },
    { label: "Employee", key: "employee_name" },
    // { label: "TL", key: "tl_name" },
    { label: "Manager", key: "manager" },
    { label: "Login POC", key: "login_poc" },
    { label: "Credit POC", key: "credit_poc" },
    { label: "Ops POC", key: "ops_poc" },
    { label: "Customer ID", key: "customer_loan_id" },
    // { label: "State", key: "location_state" },
    { label: "City", key: "city" },
    { label: "Lender", key: "lender" },
    { label: "Banker", key: "banker_details" },
    { label: "Loan Amount", key: "loan_amount" },
    { label: "Status", key: "status" },
    { label: "Login Tat", key: "login_tat" },
    { label: "Credit Tat", key: "credit_tat" },
    { label: "Credit Eligibility", key: "credit_eligibility" },
    // { label: "TAT", key: "tat_duration" },

];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLoan(n?: number) {
    if (!n) return "—";
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return "₹" + n.toLocaleString("en-IN");
}

function initials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

const AVATAR_PALETTE = [
    { bg: "#DBEAFE", color: "#1E40AF" },
    { bg: "#D1FAE5", color: "#065F46" },
    { bg: "#EDE9FE", color: "#5B21B6" },
    { bg: "#FEF3C7", color: "#92400E" },
    { bg: "#FCE7F3", color: "#9D174D" },
    { bg: "#E0F2FE", color: "#0369A1" },
];

function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}


// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = 18 }: { size?: number }) {
    return (
        <span
            style={{
                display: "inline-block",
                width: size,
                height: size,
                border: "2px solid #C3DEFE",
                borderTopColor: "#185FA5",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
            }}
        />
    );
}

type ToastItem = { id: number; msg: string; ok: boolean };

function Toast({ t, onDone }: { t: ToastItem; onDone: () => void }) {
    useEffect(() => {
        const id = setTimeout(onDone, 3000);
        return () => clearTimeout(id);
    }, []);
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: t.ok ? "#EFF6FF" : "#FEF2F2",
                color: t.ok ? "#1E40AF" : "#991B1B",
                border: `0.5px solid ${t.ok ? "#C3DEFE" : "#FCA5A5"}`,
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                minWidth: 220,
            }}
        >
            <span style={{ fontSize: 15 }}>{t.ok ? "✓" : "✕"}</span>
            {t.msg}
        </div>
    );
}

function ConfirmDialog({
    message,
    onConfirm,
    onCancel,
}: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 200,
            }}
        >
            <div
                style={{
                    background: "#fff",
                    border: "0.5px solid #C3DEFE",
                    borderRadius: 14,
                    padding: "24px 28px",
                    maxWidth: 360,
                    width: "90%",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                }}
            >
                <p style={{ fontSize: 14, marginBottom: 20, color: "#0A2540", lineHeight: 1.6 }}>
                    {message}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={onCancel} style={btnStyle("outline")}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={btnStyle("danger")}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function btnStyle(v: "primary" | "outline" | "danger"): React.CSSProperties {
    const base: React.CSSProperties = {
        padding: "7px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        border: "0.5px solid",
        transition: "all 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
    };
    if (v === "primary")
        return { ...base, background: "#185FA5", color: "#fff", borderColor: "#0C447C" };
    if (v === "danger")
        return { ...base, background: "#FEE2E2", color: "#991B1B", borderColor: "#FCA5A5" };
    return { ...base, background: "#fff", color: "#0A2540", borderColor: "#C3DEFE" };
}

const inputSx: React.CSSProperties = {
    width: "100%",
    padding: "8px 11px",
    border: "0.5px solid #C3DEFE",
    borderRadius: 8,
    fontSize: 13,
    color: "#0A2540",
    background: "#fff",
    outline: "none",
};
const inputModern = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    fontSize: 13,
    background: "#FFFFFF",
    transition: "all 0.2s ease",
};
const fieldBox = {
  background: "#fff",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  padding: "2px",
};

const inputClean = {
  width: "100%",
  padding: "10px 12px",
  border: "none",
  outline: "none",
  fontSize: 13,
  background: "transparent",
};
// ─── Main Component ───────────────────────────────────────────────────────────

export default function TodayLogin() {
    const today = new Date().toISOString().slice(0, 10);

    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [date, setDate] = useState(today);
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [editId, setEditId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const toastId = useRef(0);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<
        "all" | "login" | "approved" | "reject" | "disbursed" | "hold" | "drop"
    >("all");
    const fileRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [creditEmployees, setCreditEmployees] = useState<any[]>([]);
    const [opsEmployees, setOpsEmployees] = useState<any[]>([]);
    useEffect(() => {
        const u =
            typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem("user") || "{}")
                : {};
        setUser(u);
        setIsAdmin(String(u?.role) === "1");
    }, []);
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = localStorage.getItem("token");
                const user = JSON.parse(localStorage.getItem("user") || "{}");

                const auth = `Bearer ${token} ${user.company_id}`;

                // 🔹 CREDIT
                const creditRes = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/employees/get?designation=credit&limit=1000`,
                    {
                        headers: { Authorization: auth },
                    }
                );
                const creditJson = await creditRes.json();

                // 🔹 OPS
                const opsRes = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/employees/get?designation=ops&limit=1000`,
                    {
                        headers: { Authorization: auth },
                    }
                );
                const opsJson = await opsRes.json();

                console.log("credit 👉", creditJson);
                console.log("ops 👉", opsJson);

                // ✅ YAHI MAIN FIX
                setCreditEmployees(creditJson?.data || creditJson || []);
                setOpsEmployees(opsJson?.data || opsJson || []);

            } catch (err) {
                console.error("Employee fetch error", err);
            }
        };

        fetchEmployees();
    }, []);

    const employeeMap = useMemo(() => {
        const map: any = {};

        [...creditEmployees, ...opsEmployees].forEach((emp: any) => {
            if (emp?._id) {
                map[String(emp._id)] =
                    `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
                    emp.name ||
                    "";
            }
        });

        return map;
    }, [creditEmployees, opsEmployees]);
    const getId = (val: any) => {
        if (!val) return "";

        if (typeof val === "string") return val;

        if (val._id) return val._id;

        if (val.$oid) return val.$oid;

        return String(val);
    };
    const isAsstOpsManager = [
        "Asst. Ops Manager",
        "Ops Manager",
        "Assistant Growth Manager",
        "Sr. Operations & Alliances Manager",
        "Ops Executive",
    ].includes(user?.designation);

    const canUpload = isAdmin || isAsstOpsManager;
    const canAddRow = isAdmin || isAsstOpsManager;
    const canDeleteAll = isAdmin || isAsstOpsManager;

    const pushToast = (msg: string, ok = true) => {
        const id = ++toastId.current;
        setToasts((p) => [...p, { id, msg, ok }]);
    };
    const removeToast = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/today-login/list", { params: { date } });
            setRows(res.data);
        } catch {
            pushToast("Failed to load data", false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const handleChange = (k: keyof FormData, v: string) =>
        setForm((p) => ({ ...p, [k]: v }));

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditId(null);
        setDialogOpen(true);
    };
    const openEdit = (r: Row) => {
        const { _id, date: _d, ...rest } = r;
        setForm(rest as FormData);
        setEditId(_id);
        setDialogOpen(true);
    };
    const closeDialog = () => {
        setDialogOpen(false);
        setForm(EMPTY_FORM);
        setEditId(null);
    };

    const handleSubmit = async () => {
        setActionLoading(true);
        try {
            const payload = { ...form, date };
            if (editId) {
                await api.patch(`/today-login/${editId}`, payload);
                pushToast("Entry updated");
            } else {
                await api.post("/today-login/create", payload);
                pushToast("Entry added");
            }
            closeDialog();
            await fetchData();
        } catch {
            pushToast("Save failed", false);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await api.delete(`/today-login/${deleteTarget}`);
            pushToast("Entry deleted");
            setDeleteTarget(null);
            await fetchData();
        } catch {
            pushToast("Delete failed", false);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setActionLoading(true);
        try {
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data);
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
            const mapped = json.map((r) => ({
                date,
                employee_name: String(r["EMP NAME"] ?? ""),
                // tl_name: String(r["TL NAME"] ?? ""),
                manager: String(r["MANAGER"] ?? ""),
                login_poc: String(r["LOGIN POC"] ?? ""),
                customer_loan_id: String(r["CUSTOMER ID"] ?? ""),
                // location_state: String(r["LOCATION STATE"] ?? ""),
                city: String(r["CITY"] ?? ""),
                lender: String(r["LENDER"] ?? ""),
                loan_amount: Number(r["LOAN AMOUNT"] ?? 0),
                credit_poc: String(r["CREDIT POC"] ?? ""),
                ops_poc: String(r["OPS POC"] ?? ""),
                banker_details: String(r["BANKER NAME & NO"] ?? ""),
                status: String(r["STATUS"] ?? "login"),
            }));
            await api.post("/today-login/upload", { rows: mapped });
            pushToast(`${mapped.length} rows uploaded`);
            await fetchData();
        } catch {
            pushToast("Upload failed", false);
        } finally {
            setActionLoading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const filtered = rows.filter((r) => {
        const matchFilter = activeFilter === "all" || r.status === activeFilter;
        const matchSearch =
            !search ||
            [r.employee_name, r.manager, r.customer_loan_id, r.city]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const totalLogin = rows.filter((r) => r.status !== "reject").length;
    const totalReject = rows.filter((r) => r.status === "reject").length;
    const totalLoan = rows.reduce((s, r) => s + (r.loan_amount ?? 0), 0);

    const STAT_CARDS = [
        { label: "Total Entries", value: rows.length, accent: "#185FA5", sub: "for selected date", valueStyle: {} },
        { label: "Logins", value: totalLogin, accent: "#16A34A", sub: "approved logins", valueStyle: { color: "#16A34A" } },
        { label: "Rejected", value: totalReject, accent: "#DC2626", sub: "rejected cases", valueStyle: { color: "#DC2626" } },
        { label: "Total Loan", value: fmtLoan(totalLoan), accent: "#185FA5", sub: "combined amount", valueStyle: { fontSize: 20, color: "#185FA5" } },
    ];

    const FILTER_TABS: {
        key: "all" | "login" | "approved" | "reject" | "disbursed" | "hold" | "drop";
        label: string;
    }[] = [
            { key: "all", label: "All" },
            { key: "login", label: "Login" },
            { key: "approved", label: "Approved" },
            { key: "disbursed", label: "Disbursed" },
            { key: "hold", label: "Hold" },
            { key: "drop", label: "Drop" },
            { key: "reject", label: "Rejected" },
        ];

    const tabActiveColor = {
        all: "#185FA5",
        login: "#92400E",
        approved: "#1E40AF",
        disbursed: "#16A34A",
        hold: "#374151",
        drop: "#7F1D1D",
        reject: "#DC2626",
    };
    // ─── Render ───────────────────────────────────────────────────────────────



    return (
        <>
            <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        .tl-row:hover td  { background: #F8FAFC; }
        .ib { background:transparent; border:none; cursor:pointer; padding:5px 7px; border-radius:7px;
              display:inline-flex; align-items:center; transition:background .15s; }
        .ib:hover { background: #EBF4FF; }
        .ib-edit:hover { color: #185FA5 !important; }
        .ib-del:hover  { color: #DC2626 !important; }
        .dl-input:focus { border-color: #378ADD !important; box-shadow: 0 0 0 3px #EBF4FF; }
        .filter-tab { padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 500;
                      cursor: pointer; border: 0.5px solid transparent; background: transparent;
                      color: #5B7FA6; transition: all 0.15s; }
        .filter-tab:hover { background: #fff; }
      `}</style>

            {/* Toasts */}
            <div
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    zIndex: 500,
                }}
            >
                {toasts.map((t) => (
                    <Toast key={t.id} t={t} onDone={() => removeToast(t.id)} />
                ))}
            </div>

            {/* Confirm Delete */}
            {deleteTarget && canDeleteAll && (
                <ConfirmDialog
                    message="Delete this entry permanently? This cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* Add/Edit Dialog */}
            {dialogOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeDialog();
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            border: "0.5px solid #C3DEFE",
                            borderRadius: 16,
                            width: "90%",
                            maxWidth: 560,
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
                            animation: "fadeUp 0.18s ease",
                        }}
                    >
                        {/* Dialog Header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "18px 22px",
                                borderBottom: "0.5px solid #E2E8F0",
                                background: "linear-gradient(135deg, #EFF6FF, #F8FAFC)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: "#185FA5",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 16,
                                    }}
                                >
                                    +
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                                        {editId ? "Edit Entry" : "New Login Entry"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#64748B" }}>
                                        Fill details to create a login case
                                    </div>
                                </div>
                            </div>

                            <button onClick={closeDialog} className="ib">✕</button>
                        </div>

                        <div
                            style={{
                                overflowY: "auto",
                                padding: "22px 26px",
                                flex: 1,
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "20px 18px",
                                alignContent: "start",
                                background: "#F8FAFC",
                            }}
                        >
                            {FIELDS.map(({ key, label, type }) => {
                                const getLabel = (emp: any) =>
                                    (emp?.first_name || emp?.last_name)
                                        ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
                                        : emp?.name || emp?.employee_name || emp?.email || "Employee";

                                return (
                                    <div
                                        key={key}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 6,
                                            ...(key === "banker_details" && { gridColumn: "1 / -1" }),
                                        }}
                                    >
                                        {/* 🔹 Label */}
                                        <label
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: "#334155",
                                                letterSpacing: "0.03em",
                                            }}
                                        >
                                            {label}
                                        </label>

                                        {/* 🔹 Input Wrapper */}
                                        <div style={fieldBox}>
                                            {key === "credit_poc" ? (
                                                <select value={form[key] || ""} onChange={(e) => handleChange(key, e.target.value)} style={inputClean}>
                                                    <option value="">Select Credit Employee</option>
                                                    {creditEmployees.map((emp: any, i) => (
                                                        <option key={emp._id || i} value={emp._id}>
                                                            {getLabel(emp)}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : key === "ops_poc" ? (
                                                <select value={form[key] || ""} onChange={(e) => handleChange(key, e.target.value)} style={inputClean}>
                                                    <option value="">Select Ops Employee</option>
                                                    {opsEmployees.map((emp: any, i) => (
                                                        <option key={emp._id || i} value={emp._id}>
                                                            {getLabel(emp)}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : key === "login_poc" ? (
                                                <select value={form[key] || ""} onChange={(e) => handleChange(key, e.target.value)} style={inputClean}>
                                                    <option value="">Select Employee</option>
                                                    {[...creditEmployees, ...opsEmployees].map((emp: any, i) => (
                                                        <option key={emp._id || i} value={emp._id}>
                                                            {getLabel(emp)}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={type ?? "text"}
                                                    value={String(form[key] ?? "")}
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                    style={inputClean}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 🔥 STATUS (UPGRADED) */}
                            <div
                                style={{
                                    gridColumn: "1 / -1",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    marginTop: 4,
                                }}
                            >
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                                    Status
                                </label>

                                {/* 👇 BUTTON STYLE STATUS */}
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {[
                                        { key: "login", label: "Login", color: "#FACC15" },
                                        { key: "approved", label: "Approved", color: "#3B82F6" },
                                        { key: "reject", label: "Reject", color: "#EF4444" },
                                        { key: "disbursed", label: "Disbursed", color: "#22C55E" },
                                        { key: "hold", label: "Hold", color: "#6B7280" },
                                        { key: "drop", label: "Drop", color: "#991B1B" },
                                    ].map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() =>
                                                setForm((p) => ({
                                                    ...p,
                                                    status: s.key as any,
                                                }))
                                            }
                                            style={{
                                                padding: "6px 14px",
                                                borderRadius: 20,
                                                border: "1px solid",
                                                fontSize: 12,
                                                cursor: "pointer",
                                                background: form.status === s.key ? s.color : "#fff",
                                                color: form.status === s.key ? "#fff" : "#475569",
                                                borderColor: s.color,
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Dialog Footer */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 10,
                                padding: "14px 20px",
                                borderTop: "0.5px solid #C3DEFE",
                                background: "#F4F8FD",
                                borderRadius: "0 0 16px 16px",
                            }}
                        >
                            <button onClick={closeDialog} style={btnStyle("outline")}>
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={actionLoading}
                                style={{ ...btnStyle("primary"), opacity: actionLoading ? 0.7 : 1 }}
                            >
                                {actionLoading && <Spinner size={14} />}
                                {editId ? "Update" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page ── */}
            <div
                style={{
                    background: "#F4F8FD",
                    minHeight: "100vh",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                {/* Top Bar */}
                <div
                    style={{
                        background: "#fff",
                        borderBottom: "0.5px solid #C3DEFE",
                        padding: "14px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: "#0A2540",
                                margin: 0,
                                letterSpacing: "-0.2px",
                            }}
                        >
                            Today Login
                        </h1>
                        <p style={{ fontSize: 12, color: "#5B7FA6", margin: "2px 0 0" }}>
                            {new Date(date).toLocaleDateString("en-IN", { dateStyle: "long" })}
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ ...inputSx, width: "auto" }}
                        />
                        {canAddRow && (
                            <button onClick={openAdd} style={btnStyle("primary")}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Add Entry
                            </button>
                        )}
                        {canUpload && (
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={actionLoading}
                                style={{ ...btnStyle("outline"), opacity: actionLoading ? 0.7 : 1 }}
                            >
                                {actionLoading ? (
                                    <Spinner size={14} />
                                ) : (
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                        <path d="M6.5 1v8M3 6l3.5 3.5L10 6M2 11h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                Upload Excel
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleUpload}
                            style={{ display: "none" }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: "20px 24px", maxWidth: 1500, margin: "0 auto" }}>

                    {/* Stat Cards */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 12,
                            marginBottom: 18,
                        }}
                    >
                        {STAT_CARDS.map(({ label, value, accent, sub, valueStyle }) => (
                            <div
                                key={label}
                                style={{
                                    background: "#fff",
                                    border: "0.5px solid #C3DEFE",
                                    borderRadius: 12,
                                    padding: "14px 16px",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: 2,
                                        background: accent,
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: 11,
                                        color: "#5B7FA6",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        margin: "4px 0 6px",
                                    }}
                                >
                                    {label}
                                </p>
                                <p
                                    style={{
                                        fontSize: 26,
                                        fontWeight: 600,
                                        color: "#0A2540",
                                        margin: 0,
                                        lineHeight: 1,
                                        ...valueStyle,
                                    }}
                                >
                                    {value}
                                </p>
                                <p style={{ fontSize: 11, color: "#5B7FA6", margin: "4px 0 0" }}>{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table Card */}
                    <div
                        style={{
                            background: "#fff",
                            border: "0.5px solid #C3DEFE",
                            borderRadius: 14,
                            overflow: "hidden",
                        }}
                    >
                        {/* Toolbar */}
                        <div
                            style={{
                                padding: "12px 16px",
                                borderBottom: "0.5px solid #C3DEFE",
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                flexWrap: "wrap",
                                background: "#F8FAFC",
                            }}
                        >
                            {/* Search */}
                            <div style={{ position: "relative" }}>
                                <span
                                    style={{
                                        position: "absolute",
                                        left: 10,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#5B7FA6",
                                        fontSize: 13,
                                        pointerEvents: "none",
                                        display: "flex",
                                    }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                        <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                </span>
                                <input
                                    type="search"
                                    placeholder="Search employee, customer, city…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ ...inputSx, width: 280, paddingLeft: 30 }}
                                />
                            </div>

                            {/* Filter tabs */}
                            <div style={{ display: "flex", gap: 2 }}>
                                {FILTER_TABS.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        className="filter-tab"
                                        onClick={() => setActiveFilter(key)}
                                        style={{
                                            padding: "5px 14px",
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 500,
                                            cursor: "pointer",
                                            border: `0.5px solid ${activeFilter === key ? tabActiveColor[key] : "transparent"}`,
                                            background: activeFilter === key ? "#fff" : "transparent",
                                            color: activeFilter === key ? tabActiveColor[key] : "#5B7FA6",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <span style={{ fontSize: 12, color: "#5B7FA6", marginLeft: "auto", fontWeight: 500 }}>
                                {filtered.length} of {rows.length} entries
                            </span>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: "#F8FAFC" }}>
                                        {TABLE_COLS.map((c) => (
                                            <th
                                                key={c.key}
                                                style={{
                                                    padding: "9px 14px",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    fontSize: 11,
                                                    color: "#5B7FA6",
                                                    borderBottom: "0.5px solid #C3DEFE",
                                                    whiteSpace: "nowrap",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                {c.label}
                                            </th>
                                        ))}
                                        {(canAddRow || canDeleteAll) && (
                                            <th
                                                style={{
                                                    padding: "9px 14px",
                                                    textAlign: "right",
                                                    fontWeight: 600,
                                                    fontSize: 11,
                                                    color: "#5B7FA6",
                                                    borderBottom: "0.5px solid #C3DEFE",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={TABLE_COLS.length + 1}
                                                style={{ textAlign: "center", padding: 52 }}
                                            >
                                                <Spinner size={26} />
                                            </td>
                                        </tr>
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={TABLE_COLS.length + 1}
                                                style={{ textAlign: "center", padding: 52, color: "#5B7FA6", fontSize: 13 }}
                                            >
                                                {search ? "No entries match your search." : "No entries for this date."}
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((r) => {
                                            const av = avatarColor(r.employee_name);
                                            return (
                                                <tr
                                                    key={r._id}
                                                    className="tl-row"
                                                    style={{ borderBottom: "0.5px solid #EBF4FF", transition: "background .1s" }}
                                                >
                                                    {TABLE_COLS.map((col) => {

                                                        if (col.key === "employee_name") {
                                                            return (
                                                                <td key={col.key} style={{ padding: "10px 14px" }}>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                                                        <div
                                                                            style={{
                                                                                width: 28,
                                                                                height: 28,
                                                                                borderRadius: "50%",
                                                                                background: av.bg,
                                                                                color: av.color,
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                fontSize: 10,
                                                                                fontWeight: 700,
                                                                                flexShrink: 0,
                                                                            }}
                                                                        >
                                                                            {initials(r.employee_name)}
                                                                        </div>
                                                                        <span style={{ fontWeight: 500, color: "#0A2540" }}>
                                                                            {r.employee_name}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            );
                                                        }


                                                        if (col.key === "loan_amount") {
                                                            return (
                                                                <td
                                                                    key={col.key}
                                                                    style={{ padding: "10px 14px", color: "#185FA5", fontWeight: 500 }}
                                                                >
                                                                    {fmtLoan(r.loan_amount)}
                                                                </td>
                                                            );
                                                        }

                                                        if (col.key === "status") {
                                                            const statusConfig = {
                                                                login: { bg: "#D1FAE5", color: "#065F46", label: "Login" },
                                                                approved: { bg: "#DBEAFE", color: "#1E40AF", label: "Approved" },
                                                                reject: { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
                                                                disbursed: { bg: "#FEF3C7", color: "#92400E", label: "Disbursed" },
                                                                hold: { bg: "#E5E7EB", color: "#374151", label: "Hold" },
                                                                drop: { bg: "#FCA5A5", color: "#7F1D1D", label: "Drop" },
                                                            };


                                                            const s = statusConfig[r.status || "login"];

                                                            return (
                                                                <td key={col.key} style={{ padding: "10px 14px" }}>
                                                                    <span
                                                                        style={{
                                                                            padding: "3px 10px",
                                                                            borderRadius: 20,
                                                                            fontSize: 11,
                                                                            fontWeight: 600,
                                                                            background: s.bg,
                                                                            color: s.color,
                                                                        }}
                                                                    >
                                                                        {s.label}
                                                                    </span>
                                                                </td>
                                                            );
                                                        }
                                                        const value = r[col.key as keyof Row];
                                                        if (["login_poc", "credit_poc", "ops_poc"].includes(col.key)) {
                                                            const id = getId(value);
                                                            return (
                                                                <td key={col.key} style={{ padding: "10px 14px" }}>
                                                                    {employeeMap[id] || "—"}
                                                                </td>
                                                            );
                                                        }

                                                        if (col.key === "credit_eligibility") {
                                                            return (
                                                                <td key={col.key} style={{ padding: "10px 14px", fontWeight: 500 }}>
                                                                    {value || "—"}
                                                                </td>
                                                            );
                                                        }
                                                        if (col.key === "createdAt") {
                                                            const dateVal = value ? new Date(value as string) : null;

                                                            const time = dateVal
                                                                ? dateVal.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                                                                : "";

                                                            const date = dateVal
                                                                ? dateVal.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                                                                : "";

                                                            return (
                                                                <td key={col.key} style={{ padding: "10px 14px" }}>
                                                                    {dateVal ? (
                                                                        <div
                                                                            style={{
                                                                                display: "inline-flex",
                                                                                flexDirection: "column",
                                                                                padding: "4px 10px",
                                                                                borderRadius: 10,
                                                                                background: "#F1F5F9",
                                                                                border: "0.5px solid #CBD5F5",
                                                                                minWidth: 90,
                                                                            }}
                                                                        >
                                                                            <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>
                                                                                {time}
                                                                            </span>
                                                                            <span style={{ fontSize: 10, color: "#64748B" }}>
                                                                                {date}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        "—"
                                                                    )}
                                                                </td>
                                                            );
                                                        }
                                                        // if (col.key === "tat_duration") {
                                                        //     const duration = getDuration(r.login_tat, r.credit_tat);

                                                        //     return (
                                                        //         <td key={col.key} style={{ padding: "10px 14px" }}>
                                                        //             {duration ? (
                                                        //                 <span
                                                        //                     style={{
                                                        //                         padding: "4px 10px",
                                                        //                         borderRadius: 20,
                                                        //                         fontSize: 11,
                                                        //                         fontWeight: 600,
                                                        //                         background: "#EEF2FF",
                                                        //                         color: "#3730A3",
                                                        //                         border: "0.5px solid #C7D2FE",
                                                        //                     }}
                                                        //                 >
                                                        //                     ⏱ {duration}
                                                        //                 </span>
                                                        //             ) : (
                                                        //                 "—"
                                                        //             )}
                                                        //         </td>
                                                        //     );
                                                        // }
                                                        if (col.key === "login_tat" || col.key === "credit_tat") {
                                                            const dateVal = value ? new Date(value as string) : null;

                                                            const time = dateVal
                                                                ? dateVal.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                                                                : "";

                                                            const date = dateVal
                                                                ? dateVal.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                                                                : "";

                                                            const isLogin = col.key === "login_tat";

                                                            return (
                                                                <td key={col.key} style={{ padding: "10px 14px" }}>
                                                                    {dateVal ? (
                                                                        <div
                                                                            style={{
                                                                                display: "inline-flex",
                                                                                flexDirection: "column",
                                                                                padding: "4px 10px",
                                                                                borderRadius: 10,
                                                                                // background: isLogin ? "#E0F2FE" : "#F0FDF4",
                                                                                // border: `0.5px solid ${isLogin ? "#7DD3FC" : "#86EFAC"}`,
                                                                                minWidth: 90,
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    fontSize: 11,
                                                                                    fontWeight: 600,
                                                                                    color: isLogin ? "#0369A1" : "#166534",
                                                                                }}
                                                                            >
                                                                                {time}
                                                                            </span>
                                                                            <span
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: "#64748B",
                                                                                }}
                                                                            >
                                                                                {date}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        "—"
                                                                    )}
                                                                </td>
                                                            );
                                                        }
                                                        return (
                                                            <td
                                                                key={col.key}
                                                                style={{ padding: "10px 14px", color: value ? "#334155" : "#94A3B8" }}
                                                            >
                                                                {value || "—"}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Actions */}
                                                    {(canAddRow || canDeleteAll) && (
                                                        <td
                                                            style={{
                                                                padding: "10px 14px",
                                                                textAlign: "right",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {canAddRow && (
                                                                <button
                                                                    className="ib ib-edit"
                                                                    onClick={() => openEdit(r)}
                                                                    title="Edit"
                                                                    style={{ color: "#5B7FA6" }}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                                        <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {canDeleteAll && (
                                                                <button
                                                                    className="ib ib-del"
                                                                    onClick={() => setDeleteTarget(r._id)}
                                                                    title="Delete"
                                                                    style={{ color: "#5B7FA6" }}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                                        <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
