'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateVisitReportDialog = ({ open, onClose, refresh, editData }: any) => {

    const emptyForm = {
        doctorName: '',
        sfdcId: '',
        doctorMobile: '',
        doctorSpecialization: [],
        clinicName: '',
        clinicAddress: '',
        clinicType: '',
        localityType: '',
        clinicOpenDuringVisit: '',
        clinicExistenceYears: '',
        approxArea: '',
        furnishedStatus: '',
        ambience: '',
        ownership: '',
        visitingTiming: '',
        patientsSeen: '',
        visitingDays: [],
        consultationFees: '',
        finalStatus: '',
        remarks: '',
        visitingPersonName: '',
        employeeId: '',
        visitDate: '',
        visitTime: '',
    };

    const [formData, setFormData] = useState<any>(emptyForm);

    // ✅ Jab bhi editData change ho (edit mode open ho), form prefill karo
    useEffect(() => {
        if (editData) {
            setFormData({
                ...editData,
                // boolean → 'Yes'/'No' string (radio button ke liye)
                clinicOpenDuringVisit: editData.clinicOpenDuringVisit === true ? 'Yes' : editData.clinicOpenDuringVisit === false ? 'No' : '',
                // number → string (input ke liye)
                clinicExistenceYears: editData.clinicExistenceYears?.toString() || '',
                approxArea: editData.approxArea?.toString() || '',
                patientsSeen: editData.patientsSeen?.toString() || '',
                consultationFees: editData.consultationFees?.toString() || '',
                // array ensure
                visitingDays: editData.visitingDays || [],
                doctorSpecialization: editData.doctorSpecialization || [],
            });
        } else {
            setFormData(emptyForm);
        }
    }, [editData, open]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleVisitingDays = (e: any) => {
        const { value, checked } = e.target;
        if (checked) {
            setFormData({ ...formData, visitingDays: [...formData.visitingDays, value] });
        } else {
            setFormData({ ...formData, visitingDays: formData.visitingDays.filter((d: string) => d !== value) });
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');

            const payload = {
                ...formData,
                clinicOpenDuringVisit: formData.clinicOpenDuringVisit === 'Yes',
                clinicExistenceYears: Number(formData.clinicExistenceYears),
                approxArea: Number(formData.approxArea),
                patientsSeen: Number(formData.patientsSeen),
                consultationFees: Number(formData.consultationFees),
            };

            if (editData?._id) {
                
                await axios.put(
                    `${process.env.NEXT_PUBLIC_APP_URL}/visit-report/${editData._id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Report Updated Successfully');
            } else {
                
                await axios.post(
                    `${process.env.NEXT_PUBLIC_APP_URL}/visit-report/create-report`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Report Created Successfully');
            }

            refresh();
            onClose();
        } catch (err) {
            alert(editData?._id ? 'Error updating report' : 'Error creating report');
            console.log(err);
        }
    };

    if (!open) return null;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .cvrd-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.55);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex; align-items: center; justify-content: right;
          padding: 90px;
        }
        .cvrd-box {
          width: 100%; max-width: 780px; max-height: 90vh;
          background: #fff; border-radius: 20px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
          display: flex; flex-direction: column; overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          animation: cvrdSlideUp 0.28s ease;
        }
        @keyframes cvrdSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .cvrd-header {
          background: linear-gradient(135deg, #1a2a6c 0%, #1565c0 55%, #0d47a1 100%);
          padding: 22px 28px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; position: relative; overflow: hidden;
        }
        .cvrd-header::before {
          content: ''; position: absolute; top: -30px; right: -30px;
          width: 140px; height: 140px; border-radius: 50%;
          background: rgba(255,255,255,0.07);
        }
        .cvrd-h-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px; padding: 3px 10px;
          font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.9);
          letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px;
        }
        .cvrd-h-badge::before { content: '●'; font-size: 7px; color: #4cff91; }
        .cvrd-h-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #fff; }
        .cvrd-h-sub { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 2px; }
        .cvrd-close {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.12);
          color: #fff; font-size: 16px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all .15s; flex-shrink: 0;
        }
        .cvrd-close:hover { background: rgba(255,255,255,0.22); }
        .cvrd-body {
          flex: 1; overflow-y: auto; padding: 24px 28px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .cvrd-body::-webkit-scrollbar { width: 6px; }
        .cvrd-body::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .cvrd-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .cvrd-sec {
          background: #f8fafc; border: 1px solid #e8edf3;
          border-radius: 14px; padding: 20px 22px;
        }
        .cvrd-sec-head { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .cvrd-sec-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .cvrd-sec-title {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #1e293b;
        }
        .cvrd-sec-line { flex: 1; height: 1px; background: #e2e8f0; }
        .cvrd-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .cvrd-g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .cvrd-span2 { grid-column: span 2; }
        .cvrd-field { display: flex; flex-direction: column; gap: 5px; }
        .cvrd-label { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: .07em; text-transform: uppercase; }
        .cvrd-input {
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px;
          padding: 9px 12px; font-size: 13px; color: #1e293b;
          font-family: 'DM Sans', sans-serif; outline: none; transition: all .2s; width: 100%;
        }
        .cvrd-input::placeholder { color: #b0bec5; }
        .cvrd-input:focus { border-color: #1976d2; box-shadow: 0 0 0 3px rgba(25,118,210,0.1); }
        textarea.cvrd-input { resize: vertical; min-height: 70px; }
        .cvrd-radio-group { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 2px; }
        .cvrd-radio input[type="radio"] { display: none; }
        .cvrd-radio label {
          display: inline-flex; align-items: center; gap: 5px;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 7px;
          padding: 7px 12px; font-size: 12px; color: #475569;
          cursor: pointer; transition: all .18s; font-family: 'DM Sans', sans-serif; user-select: none;
        }
        .cvrd-radio input[type="radio"]:checked + label {
          background: #e8f0fe; border-color: #1976d2; color: #1565c0; font-weight: 500;
        }
        .cvrd-radio label:hover { background: #f1f5f9; }
        .cvrd-days { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 4px; }
        .cvrd-day input[type="checkbox"] { display: none; }
        .cvrd-day label {
          display: inline-flex; align-items: center; justify-content: center;
          width: 46px; height: 36px;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 7px;
          font-size: 11px; font-weight: 700; color: #94a3b8;
          cursor: pointer; transition: all .18s; font-family: 'Syne', sans-serif; user-select: none;
        }
        .cvrd-day input[type="checkbox"]:checked + label {
          background: #e0f2f1; border-color: #00897b; color: #00695c;
        }
        .cvrd-day label:hover { background: #f1f5f9; color: #334155; }
        .cvrd-status-group { display: flex; gap: 12px; }
        .cvrd-status input[type="radio"] { display: none; }
        .cvrd-status label {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          padding: 14px 28px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: #fff; cursor: pointer; transition: all .2s;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          color: #64748b; user-select: none;
        }
        .cvrd-status label .em { font-size: 20px; }
        .cvrd-status input[value="Positive"]:checked + label { background: #f0fdf4; border-color: #22c55e; color: #15803d; }
        .cvrd-status input[value="Negative"]:checked + label { background: #fff1f2; border-color: #f43f5e; color: #be123c; }
        .cvrd-status label:hover { background: #f1f5f9; }
        .cvrd-footer {
          padding: 16px 28px; border-top: 1px solid #e2e8f0;
          display: flex; justify-content: flex-end; gap: 10px;
          flex-shrink: 0; background: #fff;
        }
        .cvrd-btn-cancel {
          padding: 10px 20px; border-radius: 8px; border: 1.5px solid #e2e8f0;
          background: #f8fafc; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          color: #64748b; cursor: pointer; transition: all .15s;
        }
        .cvrd-btn-cancel:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .cvrd-btn-submit {
          padding: 10px 24px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #1565c0, #1976d2);
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          color: #fff; cursor: pointer; transition: all .2s;
          box-shadow: 0 4px 14px rgba(21,101,192,0.3);
        }
        .cvrd-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(21,101,192,0.4); }
        @media (max-width: 600px) {
          .cvrd-g2, .cvrd-g3 { grid-template-columns: 1fr; }
          .cvrd-span2 { grid-column: span 1; }
          .cvrd-box { max-height: 95vh; border-radius: 16px; }
          .cvrd-body { padding: 16px 16px; }
          .cvrd-header { padding: 18px 18px; }
        }
      `}</style>

            <div className="cvrd-overlay" onClick={onClose}>
                <div className="cvrd-box" onClick={(e) => e.stopPropagation()}>

                    {/* ── Header ── */}
                    <div className="cvrd-header">
                        <div>
                            <div className="cvrd-h-badge">Sales Force · Field Report</div>
                            {/* ✅ Edit/Create title dynamic */}
                            <div className="cvrd-h-title">{editData ? '✏️ Edit Visit Report' : 'New Visit Report'}</div>
                            <div className="cvrd-h-sub">
                                {editData ? 'Update the details below and save changes.' : 'Fill all details after visiting the clinic.'}
                            </div>
                        </div>
                        <button className="cvrd-close" onClick={onClose}>✕</button>
                    </div>

                    {/* ── Body ── */}
                    <div className="cvrd-body">

                        {/* Section 1 — Doctor & Clinic */}
                        <div className="cvrd-sec">
                            <div className="cvrd-sec-head">
                                <div className="cvrd-sec-icon" style={{ background: 'rgba(56,120,255,0.12)' }}>🏥</div>
                                <div className="cvrd-sec-title">Doctor & Clinic Information</div>
                                <div className="cvrd-sec-line" />
                            </div>
                            <div className="cvrd-g2">
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Doctor Name</label>
                                    <input className="cvrd-input" name="doctorName" placeholder="Dr. Sharma"
                                        value={formData.doctorName} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">SFDC ID</label>
                                    <input className="cvrd-input" name="sfdcId" placeholder="SFD-0001"
                                        value={formData.sfdcId} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Doctor Mobile</label>
                                    <input className="cvrd-input" name="doctorMobile" placeholder="9876543210"
                                        value={formData.doctorMobile} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field cvrd-span2">
                                    <label className="cvrd-label">Doctor Specialization</label>
                                    <input className="cvrd-input" name="doctorSpecialization"
                                        placeholder="e.g. Cardiologist, Diabetologist"
                                        value={Array.isArray(formData.doctorSpecialization) ? formData.doctorSpecialization.join(', ') : formData.doctorSpecialization}
                                        onChange={(e) =>
                                            setFormData({ ...formData, doctorSpecialization: e.target.value.split(',').map((s: string) => s.trim()) })
                                        }
                                    />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Clinic Name</label>
                                    <input className="cvrd-input" name="clinicName" placeholder="Apollo Clinic"
                                        value={formData.clinicName} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field cvrd-span2">
                                    <label className="cvrd-label">Clinic Address</label>
                                    <textarea className="cvrd-input" name="clinicAddress" placeholder="Street, Area, City, PIN..."
                                        value={formData.clinicAddress} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2 — Clinic Details */}
                        <div className="cvrd-sec">
                            <div className="cvrd-sec-head">
                                <div className="cvrd-sec-icon" style={{ background: 'rgba(0,200,160,0.12)' }}>🔍</div>
                                <div className="cvrd-sec-title">Clinic Details</div>
                                <div className="cvrd-sec-line" />
                            </div>
                            <div className="cvrd-g2" style={{ marginBottom: 16 }}>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Clinic Type</label>
                                    <div className="cvrd-radio-group" style={{ flexDirection: 'column' }}>
                                        {['Individual Clinic', 'Multispeciality Clinic', 'Hospital OPD', 'Diagnostic Center'].map(v => (
                                            <div className="cvrd-radio" key={v}>
                                                <input type="radio" name="clinicType" id={`ct-${v}`} value={v}
                                                    checked={formData.clinicType === v} onChange={handleChange} />
                                                <label htmlFor={`ct-${v}`}>{v}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Locality Type</label>
                                    <div className="cvrd-radio-group" style={{ flexDirection: 'column', marginBottom: 14 }}>
                                        {['Commercial Zone', 'Residential Zone'].map(v => (
                                            <div className="cvrd-radio" key={v}>
                                                <input type="radio" name="localityType" id={`lt-${v}`} value={v}
                                                    checked={formData.localityType === v} onChange={handleChange} />
                                                <label htmlFor={`lt-${v}`}>{v}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <label className="cvrd-label">Clinic Open During Visit?</label>
                                    <div className="cvrd-radio-group" style={{ marginTop: 6 }}>
                                        {['Yes', 'No'].map(v => (
                                            <div className="cvrd-radio" key={v}>
                                                <input type="radio" name="clinicOpenDuringVisit" id={`co-${v}`} value={v}
                                                    checked={formData.clinicOpenDuringVisit === v} onChange={handleChange} />
                                                <label htmlFor={`co-${v}`}>{v === 'Yes' ? '✓ Yes' : '✗ No'}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="cvrd-field" style={{ maxWidth: 200 }}>
                                <label className="cvrd-label">Clinic Existence (Years)</label>
                                <input className="cvrd-input" name="clinicExistenceYears" type="number" placeholder="5"
                                    value={formData.clinicExistenceYears} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Section 3 — Setup & Ownership */}
                        <div className="cvrd-sec">
                            <div className="cvrd-sec-head">
                                <div className="cvrd-sec-icon" style={{ background: 'rgba(255,180,50,0.12)' }}>🏗️</div>
                                <div className="cvrd-sec-title">Clinic Setup & Ownership</div>
                                <div className="cvrd-sec-line" />
                            </div>
                            <div className="cvrd-g2" style={{ marginBottom: 16 }}>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Approx Area (sq ft)</label>
                                    <input className="cvrd-input" name="approxArea" type="number" placeholder="500"
                                        value={formData.approxArea} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Furnished Status</label>
                                    <div className="cvrd-radio-group">
                                        {['Furnished', 'Unfurnished'].map(v => (
                                            <div className="cvrd-radio" key={v}>
                                                <input type="radio" name="furnishedStatus" id={`fs-${v}`} value={v}
                                                    checked={formData.furnishedStatus === v} onChange={handleChange} />
                                                <label htmlFor={`fs-${v}`}>{v}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="cvrd-g2">
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Ambience</label>
                                    <div className="cvrd-radio-group">
                                        {[['Good', '😊'], ['Average', '😐'], ['Bad', '😟']].map(([v, e]) => (
                                            <div className="cvrd-radio" key={v}>
                                                <input type="radio" name="ambience" id={`amb-${v}`} value={v}
                                                    checked={formData.ambience === v} onChange={handleChange} />
                                                <label htmlFor={`amb-${v}`}>{e} {v}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Ownership</label>
                                    <div className="cvrd-radio-group">
                                        {['Owned', 'Rented', 'Other'].map(v => (
                                            <div className="cvrd-radio" key={v}>
                                                <input type="radio" name="ownership" id={`own-${v}`} value={v}
                                                    checked={formData.ownership === v} onChange={handleChange} />
                                                <label htmlFor={`own-${v}`}>{v}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4 — Visit Info */}
                        <div className="cvrd-sec">
                            <div className="cvrd-sec-head">
                                <div className="cvrd-sec-icon" style={{ background: 'rgba(180,100,255,0.12)' }}>📅</div>
                                <div className="cvrd-sec-title">Visit Information</div>
                                <div className="cvrd-sec-line" />
                            </div>
                            <div className="cvrd-g2" style={{ marginBottom: 16 }}>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Visiting Timing</label>
                                    <input className="cvrd-input" name="visitingTiming" placeholder="e.g. 9am – 1pm"
                                        value={formData.visitingTiming} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Patients Seen (approx)</label>
                                    <input className="cvrd-input" name="patientsSeen" type="number" placeholder="30"
                                        value={formData.patientsSeen} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="cvrd-field" style={{ marginBottom: 16 }}>
                                <label className="cvrd-label">Visiting Days</label>
                                <div className="cvrd-days">
                                    {days.map((day, i) => (
                                        <div className="cvrd-day" key={day}>
                                            {/* ✅ Prefilled checked state */}
                                            <input type="checkbox" id={`day-${day}`} value={fullDays[i]}
                                                checked={formData.visitingDays.includes(fullDays[i])}
                                                onChange={handleVisitingDays} />
                                            <label htmlFor={`day-${day}`}>{day}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="cvrd-field" style={{ maxWidth: 220 }}>
                                <label className="cvrd-label">Consultation Fees (₹)</label>
                                <input className="cvrd-input" name="consultationFees" type="number" placeholder="500"
                                    value={formData.consultationFees} onChange={handleChange} />
                            </div>
                        </div>


                        <div className="cvrd-sec">
                            <div className="cvrd-sec-head">
                                <div className="cvrd-sec-icon" style={{ background: 'rgba(0,220,120,0.12)' }}>📊</div>
                                <div className="cvrd-sec-title">Final Status</div>
                                <div className="cvrd-sec-line" />
                            </div>
                            <div className="cvrd-status-group" style={{ marginBottom: 16 }}>
                                <div className="cvrd-status">
                                    <input type="radio" name="finalStatus" id="stat-pos" value="Positive"
                                        checked={formData.finalStatus === 'Positive'} onChange={handleChange} />
                                    <label htmlFor="stat-pos"><span className="em">✅</span>Positive</label>
                                </div>
                                <div className="cvrd-status">
                                    <input type="radio" name="finalStatus" id="stat-neg" value="Negative"
                                        checked={formData.finalStatus === 'Negative'} onChange={handleChange} />
                                    <label htmlFor="stat-neg"><span className="em">❌</span>Negative</label>
                                </div>
                            </div>
                            <div className="cvrd-field">
                                <label className="cvrd-label">Remarks</label>
                                <textarea className="cvrd-input" name="remarks" placeholder="Any additional notes..." rows={3}
                                    value={formData.remarks} onChange={handleChange} />
                            </div>
                        </div>


                        <div className="cvrd-sec">
                            <div className="cvrd-sec-head">
                                <div className="cvrd-sec-icon" style={{ background: 'rgba(56,180,255,0.12)' }}>👤</div>
                                <div className="cvrd-sec-title">Visiting Person Details</div>
                                <div className="cvrd-sec-line" />
                            </div>
                            <div className="cvrd-g2">
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Your Name</label>
                                    <input className="cvrd-input" name="visitingPersonName" placeholder="Rahul Verma"
                                        value={formData.visitingPersonName} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Employee ID</label>
                                    <input className="cvrd-input" name="employeeId" placeholder="EMP-2024"
                                        value={formData.employeeId} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Visit Date</label>
                                    <input type="date" className="cvrd-input" name="visitDate"
                                        value={formData.visitDate} onChange={handleChange} />
                                </div>
                                <div className="cvrd-field">
                                    <label className="cvrd-label">Visit Time</label>
                                    <input type="time" className="cvrd-input" name="visitTime"
                                        value={formData.visitTime} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                    </div>


                    <div className="cvrd-footer">
                        <button className="cvrd-btn-cancel" onClick={onClose}>Cancel</button>
                        <button className="cvrd-btn-submit" onClick={handleSubmit}>
                            {editData ? 'Save Changes ✓' : 'Submit Report →'}
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default CreateVisitReportDialog;
