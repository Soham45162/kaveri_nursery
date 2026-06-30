import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { 
  UserPlus, Trash2, Edit, DollarSign, History, X, Check, Printer, 
  Coins, FileText, Upload, Calendar, Award, MapPin, Phone, 
  CreditCard, Eye, EyeOff, Search, FileSpreadsheet, Sparkles 
} from 'lucide-react';
import { createPortal } from 'react-dom';

export default function LabourRegister() {
  // Main Data States
  const [labours, setLabours] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [payments, setPayments] = useState({});
  const [advances, setAdvances] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // UI Views State
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'attendance', 'payroll', 'reports'
  const [reportType, setReportType] = useState('attendance'); // 'attendance', 'salary', 'advance', 'payments', 'performance'

  // Forms States
  const [form, setForm] = useState({
    name: '',
    skillType: 'Gardener',
    phone: '',
    aadhaar: '',
    address: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    salaryType: 'daily',
    salaryRate: '',
    photoFile: null,
    photoPreview: ''
  });

  const [editingLabour, setEditingLabour] = useState(null);
  const [payingLabourId, setPayingLabourId] = useState(null);
  const [recordingAdvanceLabourId, setRecordingAdvanceLabourId] = useState(null);
  
  const [payForm, setPayForm] = useState({ amount: '', notes: '', date: new Date().toISOString().slice(0, 10) });
  const [advanceForm, setAdvanceForm] = useState({ amount: '', notes: '', date: new Date().toISOString().slice(0, 10) });
  
  const [viewingHistoryLabourId, setViewingHistoryLabourId] = useState(null);
  const [historyTab, setHistoryTab] = useState('payments'); // 'payments' or 'advances'
  const [viewingSlipLabour, setViewingSlipLabour] = useState(null);
  const [customWageInput, setCustomWageInput] = useState(null); // { labourId, day, name, currentAmount, isNew }
  
  // Custom states for UI features
  const [unmaskedAadhaarIds, setUnmaskedAadhaarIds] = useState({});
  const [expandedHistoryIds, setExpandedHistoryIds] = useState({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    fetchData();
  }, [monthKey]);

  const fetchData = async () => {
    try {
      const labSnap = await getDocs(collection(db, 'labours'));
      setLabours(labSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const attSnap = await getDoc(doc(db, 'attendance', monthKey));
      setAttendance(attSnap.exists() ? attSnap.data() : {});

      const paySnap = await getDoc(doc(db, 'payments', monthKey));
      setPayments(paySnap.exists() ? paySnap.data() : {});

      const advSnap = await getDoc(doc(db, 'advances', monthKey));
      setAdvances(advSnap.exists() ? advSnap.data() : {});
    } catch (err) {
      console.error("Error fetching payroll data:", err);
    }
  };

  // Form Input Photo Handlers
  const handlePhotoSelect = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    if (isEdit) {
      setEditingLabour(prev => ({ ...prev, photoFile: file, photoPreview: previewUrl }));
    } else {
      setForm(prev => ({ ...prev, photoFile: file, photoPreview: previewUrl }));
    }
  };

  // Create Labourer (Add worker)
  const addLabour = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.aadhaar || !form.salaryRate) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{12}$/.test(form.aadhaar)) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setUploading(true);
    let uploadedPhotoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'; // generic elegant profile

    if (form.photoFile) {
      try {
        const fileRef = ref(storage, `labours/${Date.now()}_${form.photoFile.name}`);
        await uploadBytes(fileRef, form.photoFile);
        uploadedPhotoUrl = await getDownloadURL(fileRef);
      } catch (err) {
        console.error("Error uploading labor photo:", err);
        alert("Photo upload failed, using default placeholder.");
      }
    }

    const rateNum = Number(form.salaryRate);
    const joiningDateVal = form.joiningDate || new Date().toISOString().slice(0, 10);

    const labourData = {
      name: form.name,
      role: form.skillType, // backward compatibility
      skillType: form.skillType,
      phone: form.phone,
      aadhaar: form.aadhaar,
      address: form.address || '',
      joiningDate: joiningDateVal,
      salaryType: form.salaryType || 'daily',
      salaryRate: rateNum,
      photoUrl: uploadedPhotoUrl,
      dailyWageHistory: [
        {
          date: joiningDateVal,
          rate: rateNum,
          notes: 'Initial Rate on Joining'
        }
      ],
      joinedAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'labours'), labourData);
      setLabours(prev => [...prev, { id: docRef.id, ...labourData }]);
      setForm({
        name: '',
        skillType: 'Gardener',
        phone: '',
        aadhaar: '',
        address: '',
        joiningDate: new Date().toISOString().slice(0, 10),
        salaryType: 'daily',
        salaryRate: '',
        photoFile: null,
        photoPreview: ''
      });
      alert("Labour worker registered successfully!");
    } catch (err) {
      console.error("Error writing labour worker doc:", err);
      alert("Could not register worker. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Update Labourer (Edit worker)
  const updateLabour = async (e) => {
    e.preventDefault();
    if (!editingLabour || !editingLabour.name || !editingLabour.phone || !editingLabour.aadhaar || !editingLabour.salaryRate) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(editingLabour.phone)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{12}$/.test(editingLabour.aadhaar)) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setUploading(true);
    let photoUrl = editingLabour.photoUrl || '';

    if (editingLabour.photoFile) {
      try {
        const fileRef = ref(storage, `labours/${Date.now()}_${editingLabour.photoFile.name}`);
        await uploadBytes(fileRef, editingLabour.photoFile);
        photoUrl = await getDownloadURL(fileRef);
      } catch (err) {
        console.error("Error uploading photo:", err);
        alert("Photo upload failed, keeping existing photo.");
      }
    }

    const currentLabour = labours.find(l => l.id === editingLabour.id);
    let updatedHistory = editingLabour.dailyWageHistory || currentLabour?.dailyWageHistory || [];
    
    const newRate = Number(editingLabour.salaryRate);
    const oldRate = Number(currentLabour?.salaryRate || 0);

    if (newRate !== oldRate) {
      updatedHistory = [
        ...updatedHistory,
        {
          date: new Date().toISOString().slice(0, 10),
          rate: newRate,
          notes: `Rate updated from ₹${oldRate} to ₹${newRate}`
        }
      ];
    }

    try {
      const docRef = doc(db, 'labours', editingLabour.id);
      const updatedData = {
        name: editingLabour.name,
        role: editingLabour.skillType, // backward compatibility
        skillType: editingLabour.skillType,
        phone: editingLabour.phone,
        aadhaar: editingLabour.aadhaar,
        address: editingLabour.address || '',
        joiningDate: editingLabour.joiningDate || currentLabour?.joiningDate || '',
        salaryType: editingLabour.salaryType || 'daily',
        salaryRate: newRate,
        photoUrl: photoUrl,
        dailyWageHistory: updatedHistory
      };
      
      await setDoc(docRef, updatedData, { merge: true });
      setLabours(prev => prev.map(l => l.id === editingLabour.id ? { ...l, ...updatedData } : l));
      setEditingLabour(null);
      alert("Labourer profile updated successfully!");
    } catch (err) {
      console.error("Error updating worker doc:", err);
      alert("Could not update profile.");
    } finally {
      setUploading(false);
    }
  };

  const removeLabour = async (id) => {
    if (!window.confirm("Are you sure you want to remove this labour worker? All history will remain in monthly records but profile is deleted.")) return;
    try {
      await deleteDoc(doc(db, 'labours', id));
      setLabours(prev => prev.filter(l => l.id !== id));
      alert("Worker profile deleted.");
    } catch (err) {
      console.error("Error deleting worker:", err);
    }
  };

  const updateAttendanceStatus = async (labourId, day, status, amount = null) => {
    const newAttendance = {
      ...attendance,
      [labourId]: {
        ...(attendance[labourId] || {})
      }
    };

    if (status) {
      newAttendance[labourId][day] = status;
      if (status === 'Custom' && amount !== null) {
        newAttendance[labourId][`${day}_amount`] = amount;
      } else {
        delete newAttendance[labourId][`${day}_amount`];
      }
    } else {
      delete newAttendance[labourId][day];
      delete newAttendance[labourId][`${day}_amount`];
    }

    setAttendance(newAttendance);

    try {
      const docRef = doc(db, 'attendance', monthKey);
      await setDoc(docRef, newAttendance, { merge: true });
    } catch (err) {
      console.error("Error updating attendance state in database:", err);
    }
  };

  // Attendance Toggle Statuses
  const toggleStatus = async (labourId, day) => {
    const labour = labours.find(l => l.id === labourId);
    const currentStatus = attendance[labourId]?.[day];

    if (!currentStatus) {
      await updateAttendanceStatus(labourId, day, 'Full');
    } else if (currentStatus === 'Full') {
      await updateAttendanceStatus(labourId, day, 'Half');
    } else if (currentStatus === 'Half') {
      await updateAttendanceStatus(labourId, day, 'Absent');
    } else if (currentStatus === 'Absent') {
      const currentAmount = attendance[labourId]?.[`${day}_amount`] || labour?.salaryRate || '';
      setCustomWageInput({ labourId, day, name: labour?.name, currentAmount, isNew: true });
    } else if (currentStatus === 'Custom') {
      const currentAmount = attendance[labourId]?.[`${day}_amount`] || labour?.salaryRate || '';
      setCustomWageInput({ labourId, day, name: labour?.name, currentAmount, isNew: false });
    }
  };

  const handleCancelCustomWage = async () => {
    if (customWageInput) {
      if (customWageInput.isNew) {
        await updateAttendanceStatus(customWageInput.labourId, customWageInput.day, null);
      }
      setCustomWageInput(null);
    }
  };



  // Salary Payments and Advances Record Triggers
  const recordPayment = async (e) => {
    e.preventDefault();
    if (!payingLabourId || !payForm.amount) return;
    
    const amountNum = Number(payForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const newTx = {
      id: Date.now().toString(),
      date: payForm.date || new Date().toISOString().slice(0, 10),
      amount: amountNum,
      notes: payForm.notes || 'Salary Payment'
    };
    
    const newPayments = { ...payments };
    if (!newPayments[payingLabourId]) {
      newPayments[payingLabourId] = [];
    }
    newPayments[payingLabourId].push(newTx);
    
    setPayments(newPayments);
    setPayingLabourId(null);
    setPayForm({ amount: '', notes: '', date: new Date().toISOString().slice(0, 10) });
    
    try {
      const docRef = doc(db, 'payments', monthKey);
      await setDoc(docRef, newPayments);
    } catch (err) {
      console.error("Error saving payment doc:", err);
    }
  };

  const deletePayment = async (labourId, txId) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    
    const newPayments = { ...payments };
    if (newPayments[labourId]) {
      newPayments[labourId] = newPayments[labourId].filter(tx => tx.id !== txId);
      if (newPayments[labourId].length === 0) {
        delete newPayments[labourId];
      }
    }
    
    setPayments(newPayments);
    try {
      const docRef = doc(db, 'payments', monthKey);
      await setDoc(docRef, newPayments);
    } catch (err) {
      console.error("Error deleting payment transaction:", err);
    }
  };

  const recordAdvance = async (e) => {
    e.preventDefault();
    if (!recordingAdvanceLabourId || !advanceForm.amount) return;
    
    const amountNum = Number(advanceForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const newTx = {
      id: Date.now().toString(),
      date: advanceForm.date || new Date().toISOString().slice(0, 10),
      amount: amountNum,
      notes: advanceForm.notes || 'Salary Advance'
    };
    
    const newAdvances = { ...advances };
    if (!newAdvances[recordingAdvanceLabourId]) {
      newAdvances[recordingAdvanceLabourId] = [];
    }
    newAdvances[recordingAdvanceLabourId].push(newTx);
    
    setAdvances(newAdvances);
    setRecordingAdvanceLabourId(null);
    setAdvanceForm({ amount: '', notes: '', date: new Date().toISOString().slice(0, 10) });
    
    try {
      const docRef = doc(db, 'advances', monthKey);
      await setDoc(docRef, newAdvances);
    } catch (err) {
      console.error("Error saving advance doc:", err);
    }
  };

  const deleteAdvance = async (labourId, txId) => {
    if (!window.confirm("Are you sure you want to delete this advance record?")) return;
    
    const newAdvances = { ...advances };
    if (newAdvances[labourId]) {
      newAdvances[labourId] = newAdvances[labourId].filter(tx => tx.id !== txId);
      if (newAdvances[labourId].length === 0) {
        delete newAdvances[labourId];
      }
    }
    
    setAdvances(newAdvances);
    try {
      const docRef = doc(db, 'advances', monthKey);
      await setDoc(docRef, newAdvances);
    } catch (err) {
      console.error("Error deleting advance transaction:", err);
    }
  };

  // Helper Calculations
  const calculateTotals = (labourId) => {
    const record = attendance[labourId] || {};
    let full = 0, half = 0, absent = 0, custom = 0, customAmount = 0;
    Object.keys(record).forEach(key => {
      if (!key.endsWith('_amount')) {
        const val = record[key];
        if (val === 'Full') full++;
        else if (val === 'Half') half++;
        else if (val === 'Absent') absent++;
        else if (val === 'Custom') {
          custom++;
          customAmount += Number(record[`${key}_amount`] || 0);
        }
      }
    });
    return { full, half, absent, custom, customAmount };
  };

  const grandTotals = useMemo(() => {
    let full = 0, half = 0, absent = 0, custom = 0, customAmount = 0;
    labours.forEach(labour => {
      const totals = calculateTotals(labour.id);
      full += totals.full;
      half += totals.half;
      absent += totals.absent;
      custom += totals.custom;
      customAmount += totals.customAmount;
    });
    return { full, half, absent, custom, customAmount };
  }, [labours, attendance]);

  const payrollTotals = useMemo(() => {
    let workedDays = 0;
    let grossSalary = 0;
    let salaryCut = 0;
    let netSalary = 0;
    let totalAdvance = 0;
    let netPayable = 0;
    let totalPaid = 0;
    let balanceDue = 0;

    labours.forEach(labour => {
      const totals = calculateTotals(labour.id);
      const wDays = totals.full + 0.5 * totals.half + (totals.custom || 0);
      const standardWorkedDays = totals.full + 0.5 * totals.half;
      
      const salaryType = labour.salaryType || 'daily';
      const salaryRate = labour.salaryRate || 0;
      
      let gross = 0;
      let cut = 0;
      let net = 0;
      
      if (salaryType === 'monthly') {
        gross = salaryRate;
        net = Math.round((salaryRate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
        cut = gross - net;
      } else {
        gross = Math.round(salaryRate * (daysInMonth - (totals.custom || 0)) + (totals.customAmount || 0));
        net = Math.round(salaryRate * standardWorkedDays) + (totals.customAmount || 0);
        cut = gross - net;
      }
      
      const labourAdvances = advances[labour.id] || [];
      const adv = labourAdvances.reduce((sum, tx) => sum + tx.amount, 0);
      const payable = net - adv;
      
      const labourPayments = payments[labour.id] || [];
      const paid = labourPayments.reduce((sum, tx) => sum + tx.amount, 0);
      const balance = payable - paid;

      workedDays += wDays;
      grossSalary += gross;
      salaryCut += cut;
      netSalary += net;
      totalAdvance += adv;
      netPayable += payable;
      totalPaid += paid;
      balanceDue += balance;
    });

    return {
      workedDays,
      grossSalary,
      salaryCut,
      netSalary,
      totalAdvance,
      netPayable,
      totalPaid,
      balanceDue
    };
  }, [labours, attendance, advances, payments, daysInMonth]);

  const getStatusColor = (status) => {
    if (status === 'Full') return 'bg-green-500 text-white shadow-sm';
    if (status === 'Half') return 'bg-amber-400 text-amber-950 shadow-sm font-bold';
    if (status === 'Absent') return 'bg-red-500 text-white shadow-sm';
    if (status === 'Custom') return 'bg-purple-500 text-white shadow-sm font-bold';
    return 'bg-gray-100 hover:bg-gray-200 dark:bg-leaf-800 dark:hover:bg-leaf-700 dark:text-leaf-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'Full') return 'F';
    if (status === 'Half') return 'H';
    if (status === 'Absent') return 'A';
    if (status === 'Custom') return 'C';
    return '-';
  };

  // Search Filter
  const filteredLabours = labours.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.skillType || l.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.phone || '').includes(searchQuery)
  );

  // Mask Security helpers
  const toggleAadhaarMask = (id) => {
    setUnmaskedAadhaarIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHistoryExpansion = (id) => {
    setExpandedHistoryIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getAadhaarDisplay = (id, number) => {
    if (!number) return 'N/A';
    if (unmaskedAadhaarIds[id]) {
      return `${number.slice(0, 4)} ${number.slice(4, 8)} ${number.slice(8, 12)}`;
    }
    return `XXXX XXXX ${number.slice(8, 12)}`;
  };

  // Performance Rating Calculator
  const getPerformanceRating = (workedDays) => {
    const pct = Math.min(100, Math.round((workedDays / daysInMonth) * 100));
    if (pct >= 95) return { label: 'Excellent', style: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800' };
    if (pct >= 85) return { label: 'Good', style: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800' };
    if (pct >= 70) return { label: 'Average', style: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800' };
    return { label: 'Needs Improvement', style: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800' };
  };

  // Trigger browser print function for current report view
  const printReport = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) document.documentElement.classList.remove('dark');
    
    document.body.classList.add('printing-payroll');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-payroll');
      if (isDark) document.documentElement.classList.add('dark');
    }, 50);
  };

  return (
    <div className="rounded-[2.5rem] bg-white p-6 shadow-xl border border-leaf-700/5 dark:bg-leaf-900/60 dark:border-leaf-700/15">
      
      {/* Tab Navigation header */}
      <div className="no-print mb-8 flex flex-col justify-between gap-5 border-b border-leaf-700/10 pb-5 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-2 text-leaf-900 dark:text-white">
            <UserPlus className="text-leaf-600" /> Labour ERP System
          </h2>
          <p className="text-sm text-leaf-700/70 dark:text-leaf-300/70 mt-1">
            Manage worker cards, attendance registers, wage changes, and comprehensive payroll reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="month" 
            value={monthKey} 
            onChange={(e) => {
              if (e.target.value) setCurrentDate(new Date(e.target.value + '-01T00:00:00'));
            }} 
            className="rounded-xl border border-leaf-700/20 bg-cream/40 px-4 py-2 font-bold outline-none dark:bg-leaf-900 dark:border-leaf-800 focus:ring-2 focus:ring-leaf-500" 
          />

          <div className="flex items-center rounded-xl bg-leaf-50 p-1 dark:bg-leaf-900/80">
            <button 
              onClick={() => setActiveTab('directory')}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${activeTab === 'directory' ? 'bg-white text-leaf-900 shadow dark:bg-leaf-700 dark:text-white' : 'text-leaf-700/70 hover:text-leaf-900 dark:text-leaf-300'}`}
            >
              Directory
            </button>
            <button 
              onClick={() => setActiveTab('attendance')}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-white text-leaf-900 shadow dark:bg-leaf-700 dark:text-white' : 'text-leaf-700/70 hover:text-leaf-900 dark:text-leaf-300'}`}
            >
              Attendance Grid
            </button>
            <button 
              onClick={() => setActiveTab('payroll')}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${activeTab === 'payroll' ? 'bg-white text-leaf-900 shadow dark:bg-leaf-700 dark:text-white' : 'text-leaf-700/70 hover:text-leaf-900 dark:text-leaf-300'}`}
            >
              Payroll Ledger
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-white text-leaf-900 shadow dark:bg-leaf-700 dark:text-white' : 'text-leaf-700/70 hover:text-leaf-900 dark:text-leaf-300'}`}
            >
              Reports Center
            </button>
          </div>
        </div>
      </div>

      {/* Directory Tab View */}
      {activeTab === 'directory' && (
        <div className="grid gap-8 lg:grid-cols-3 no-print">
          
          {/* Add New Worker Panel */}
          <div className="glass rounded-[2rem] p-6 border border-leaf-700/10 dark:bg-leaf-900/30">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-5">
              <UserPlus className="text-leaf-600" /> Register Worker
            </h3>
            
            <form onSubmit={addLabour} className="space-y-4 text-left">
              {/* Photo Upload selector */}
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Worker Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-leaf-700/10 bg-leaf-50 dark:bg-leaf-800">
                    {form.photoPreview ? (
                      <img src={form.photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs font-bold text-leaf-500">No Photo</div>
                    )}
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 rounded-xl bg-leaf-100 px-4 py-2 text-xs font-bold text-leaf-800 hover:bg-leaf-200 dark:bg-leaf-800 dark:text-leaf-200 dark:hover:bg-leaf-700 transition">
                    <Upload size={14} /> Upload File
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoSelect(e, false)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Full Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter worker full name" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Skill Type *</label>
                  <select 
                    value={form.skillType} 
                    onChange={e => setForm({ ...form, skillType: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2.5 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm"
                  >
                    <option value="Gardener">Gardener</option>
                    <option value="Landscaper">Landscaper</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Helper">Helper</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Joining Date</label>
                  <input 
                    type="date" 
                    value={form.joiningDate} 
                    onChange={e => setForm({ ...form, joiningDate: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Mobile *</label>
                  <input 
                    type="text" 
                    maxLength="10"
                    placeholder="10-digit number" 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Aadhaar No. *</label>
                  <input 
                    type="text" 
                    maxLength="12"
                    placeholder="12-digit number" 
                    value={form.aadhaar} 
                    onChange={e => setForm({ ...form, aadhaar: e.target.value.replace(/\D/g, '') })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Salary Type</label>
                  <select 
                    value={form.salaryType} 
                    onChange={e => setForm({ ...form, salaryType: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2.5 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm"
                  >
                    <option value="daily">Daily Wage</option>
                    <option value="monthly">Monthly Salary</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Rate (₹) *</label>
                  <input 
                    type="number" 
                    placeholder="Wage rate" 
                    value={form.salaryRate} 
                    onChange={e => setForm({ ...form, salaryRate: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Home Address</label>
                <textarea 
                  placeholder="Street details, town/village, pincode" 
                  value={form.address} 
                  onChange={e => setForm({ ...form, address: e.target.value })} 
                  rows="2"
                  className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="btn-primary w-full py-3 mt-4 text-xs font-bold uppercase tracking-wider bg-leaf-600 hover:bg-leaf-700 border-none shadow-md"
              >
                {uploading ? 'Registering...' : 'Register Worker'}
              </button>
            </form>
          </div>

          {/* Directory Listings */}
          <div className="lg:col-span-2 space-y-5 text-left">
            <div className="flex items-center gap-3 bg-cream/20 p-3 rounded-2xl border border-leaf-700/10">
              <Search className="text-leaf-600" size={18} />
              <input 
                type="text" 
                placeholder="Search workers by name, skill category, or mobile..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-leaf-900 dark:text-leaf-100"
              />
            </div>

            {filteredLabours.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-cream/10 rounded-2xl border border-dashed border-leaf-700/20">
                No active workers match the criteria.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredLabours.map(labour => (
                  <div key={labour.id} className="relative glass p-5 rounded-[2rem] border border-leaf-700/10 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex items-start gap-4">
                        <img 
                          src={labour.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                          alt={labour.name} 
                          className="h-16 w-16 rounded-full object-cover border-2 border-leaf-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-lg truncate text-leaf-900 dark:text-white">{labour.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center gap-1 bg-leaf-100 text-leaf-800 px-2.5 py-0.5 rounded-full text-xxs font-extrabold dark:bg-leaf-900 dark:text-leaf-100">
                              <Award size={10} /> {labour.skillType || labour.role || 'Gardener'}
                            </span>
                            <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xxs font-bold dark:bg-leaf-900 dark:text-leaf-300">
                              ₹{labour.salaryRate}/{labour.salaryType === 'monthly' ? 'm' : 'd'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Fields */}
                      <div className="mt-4 pt-3 border-t border-leaf-700/5 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-leaf-300">
                          <Phone size={13} className="text-leaf-600 dark:text-leaf-300 shrink-0" />
                          <span>{labour.phone || 'No Mobile'}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600 dark:text-leaf-300">
                          <div className="flex items-center gap-2">
                            <CreditCard size={13} className="text-leaf-600 dark:text-leaf-300 shrink-0" />
                            <span>Aadhaar: {getAadhaarDisplay(labour.id, labour.aadhaar)}</span>
                          </div>
                          <button 
                            onClick={() => toggleAadhaarMask(labour.id)}
                            className="text-xxs font-bold text-leaf-600 dark:text-leaf-300 hover:underline inline-flex items-center gap-0.5 shrink-0"
                          >
                            {unmaskedAadhaarIds[labour.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                            {unmaskedAadhaarIds[labour.id] ? 'Hide' : 'Reveal'}
                          </button>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600 dark:text-leaf-300">
                          <MapPin size={13} className="text-leaf-600 dark:text-leaf-300 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">{labour.address || 'Address not listed'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-leaf-300 text-xxs">
                          <Calendar size={11} className="text-leaf-500" />
                          <span>Joined: {labour.joiningDate ? new Date(labour.joiningDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                        </div>
                      </div>

                      {/* Wage History Toggle */}
                      <div className="mt-4">
                        <button
                          onClick={() => toggleHistoryExpansion(labour.id)}
                          className="w-full text-left text-xxs font-bold text-leaf-700 hover:text-leaf-900 dark:text-leaf-300 dark:hover:text-white bg-cream/35 dark:bg-leaf-900/40 p-2 rounded-lg flex items-center justify-between"
                        >
                          <span>Daily Wage History</span>
                          <span className="text-xs">{expandedHistoryIds[labour.id] ? '−' : '+'}</span>
                        </button>
                        
                        {expandedHistoryIds[labour.id] && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-leaf-900/60 rounded-lg text-xxs space-y-1 max-h-24 overflow-y-auto border border-leaf-700/5">
                            {(!labour.dailyWageHistory || labour.dailyWageHistory.length === 0) ? (
                              <p className="text-gray-400 dark:text-leaf-300/60 italic">No wage change log recorded.</p>
                            ) : (
                              [...labour.dailyWageHistory].reverse().map((entry, idx) => (
                                <div key={idx} className="flex justify-between border-b border-gray-200 dark:border-leaf-800 pb-1 last:border-0 last:pb-0">
                                  <span className="text-gray-500 dark:text-leaf-300">{entry.date}</span>
                                  <strong className="text-leaf-900 dark:text-leaf-100">₹{entry.rate}</strong>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="mt-5 pt-3 border-t border-leaf-700/10 flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingLabour(labour)}
                        className="p-1.5 text-leaf-700 hover:bg-leaf-100 rounded-lg transition dark:hover:bg-leaf-800"
                        title="Edit Worker Profile"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => removeLabour(labour.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition dark:hover:bg-red-950/20"
                        title="Delete Worker Profile"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance Grid Tab View */}
      {activeTab === 'attendance' && (
        <div className="attendance-section-wrap text-left">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-leaf-600" /> Attendance Spreadsheet Grid
              </h3>
              <p className="text-xs text-gray-500 dark:text-leaf-300 mt-0.5">Click cells: [F]ull Day → [H]alf Day → [A]bsent → [Clear]. Saves automatically.</p>
            </div>
            
            <button 
              type="button" 
              onClick={() => {
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) document.documentElement.classList.remove('dark');
                document.body.classList.add('printing-labour');
                setTimeout(() => {
                  window.print();
                  document.body.classList.remove('printing-labour');
                  if (isDark) document.documentElement.classList.add('dark');
                }, 50);
              }}
              className="inline-flex items-center gap-1.5 bg-leaf-100 hover:bg-leaf-200 text-leaf-900 px-4 py-2 rounded-xl text-xs font-extrabold transition dark:bg-leaf-800 dark:hover:bg-leaf-700 dark:text-leaf-100"
            >
              <Printer size={13} /> Print attendance
            </button>
          </div>

          <div className="print-header hidden mb-6 text-center text-black">
            <h1 className="text-3xl font-bold uppercase tracking-wider">Kaveri Nursery - Attendance</h1>
            <p className="text-lg mt-1 font-semibold">Month: {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="overflow-x-auto border border-leaf-700/10 rounded-2xl print-table-wrapper">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse bg-white dark:bg-leaf-950/20">
              <thead>
                <tr className="border-b border-leaf-700/20 font-bold uppercase text-soil dark:text-leaf-300 bg-leaf-50/50 dark:bg-leaf-900/40">
                  <th className="p-3.5 border-r border-leaf-700/10 min-w-[170px] sticky left-0 bg-white dark:bg-leaf-950/90 z-10 shadow-r">Name & Role</th>
                  {daysArray.map(day => (
                    <th key={day} className="p-2.5 text-center border-r border-leaf-700/10 w-9">{day}</th>
                  ))}
                  <th className="p-3 text-center border-r border-leaf-700/10 text-green-700 w-10">F</th>
                  <th className="p-3 text-center border-r border-leaf-700/10 text-amber-600 w-10">H</th>
                  <th className="p-3 text-center border-r border-leaf-700/10 text-red-600 w-10">A</th>
                  <th className="p-3 text-center border-r border-leaf-700/10 text-purple-750 dark:text-purple-300 w-10">C</th>
                  <th className="p-3 text-right text-purple-750 dark:text-purple-300 min-w-[85px]">C. Amount</th>
                </tr>
              </thead>
              <tbody>
                {labours.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 6} className="p-6 text-center text-gray-500">No registered workers found to record attendance.</td>
                  </tr>
                ) : (
                  <>
                    {labours.map(labour => {
                      const totals = calculateTotals(labour.id);
                      return (
                        <tr key={labour.id} className="border-b border-leaf-700/10 hover:bg-cream/10 dark:hover:bg-leaf-900/20 transition-all">
                          <td className="p-3 border-r border-leaf-700/10 font-bold sticky left-0 bg-white dark:bg-leaf-900/90 shadow-r z-10">
                            {labour.name}
                            <span className="block text-xxs font-normal text-gray-500">{labour.skillType || labour.role || 'Gardener'}</span>
                          </td>
                          {daysArray.map(day => {
                            const status = attendance[labour.id]?.[day];
                            return (
                              <td key={day} className="border-r border-leaf-700/10 p-1 text-center">
                                <button 
                                  onClick={() => toggleStatus(labour.id, day)}
                                  className={`h-7 rounded font-bold text-[9px] transition-all flex items-center justify-center mx-auto ${status === 'Custom' ? 'w-auto px-1 min-w-[28px]' : 'w-7'} ${getStatusColor(status)} no-print-bg`}
                                  title={status === 'Custom' ? `Custom Wage: ₹${attendance[labour.id]?.[`${day}_amount`] || 0}` : undefined}
                                >
                                  {status === 'Custom' ? `₹${attendance[labour.id]?.[`${day}_amount`] || 0}` : getStatusIcon(status)}
                                </button>
                              </td>
                            )
                          })}
                          <td className="p-3 text-center border-r border-leaf-700/10 font-bold text-green-600">{totals.full}</td>
                          <td className="p-3 text-center border-r border-leaf-700/10 font-bold text-amber-600">{totals.half}</td>
                          <td className="p-3 text-center border-r border-leaf-700/10 font-bold text-red-500">{totals.absent}</td>
                          <td className="p-3 text-center border-r border-leaf-700/10 font-bold text-purple-650 dark:text-purple-400">{totals.custom}</td>
                          <td className="p-3 text-right font-bold text-purple-650 dark:text-purple-400">₹{(totals.customAmount || 0).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-leaf-50/50 dark:bg-leaf-900/40 font-bold border-t-2 border-leaf-700/20 text-[11px]">
                      <td className="p-3 border-r border-leaf-700/10 sticky left-0 bg-leaf-50 dark:bg-leaf-900/90 shadow-r z-10 uppercase tracking-wider text-[10px]">
                        Grand Total
                      </td>
                      {daysArray.map(day => (
                        <td key={day} className="border-r border-leaf-700/10 p-1 text-center text-gray-400 font-normal">-</td>
                      ))}
                      <td className="p-3 text-center border-r border-leaf-700/10 text-green-600">{grandTotals.full}</td>
                      <td className="p-3 text-center border-r border-leaf-700/10 text-amber-600">{grandTotals.half}</td>
                      <td className="p-3 text-center border-r border-leaf-700/10 text-red-500">{grandTotals.absent}</td>
                      <td className="p-3 text-center border-r border-leaf-700/10 text-purple-650 dark:text-purple-400">{grandTotals.custom}</td>
                      <td className="p-3 text-right text-purple-650 dark:text-purple-400">₹{grandTotals.customAmount.toLocaleString()}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold no-print justify-center text-leaf-900 dark:text-leaf-200">
            <span className="flex items-center gap-2"><div className="w-5 h-5 bg-green-500 rounded shadow-sm"></div> Full Day (F)</span>
            <span className="flex items-center gap-2"><div className="w-5 h-5 bg-amber-400 rounded shadow-sm"></div> Half Day (H)</span>
            <span className="flex items-center gap-2"><div className="w-5 h-5 bg-red-500 rounded shadow-sm"></div> Absent (A)</span>
            <span className="flex items-center gap-2"><div className="w-5 h-5 bg-purple-500 rounded shadow-sm"></div> Custom Wage (C)</span>
            <span className="flex items-center gap-2 ml-4 text-gray-400 italic">Tip: Click cells in columns to toggle states. Custom Wage cells show details on hover.</span>
          </div>
        </div>
      )}

      {/* Payroll Ledger Tab View */}
      {activeTab === 'payroll' && (
        <div className="payroll-section-wrap text-left">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="text-leaf-600" /> Payroll & Payments Sheet
              </h3>
              <p className="text-xs text-gray-500 dark:text-leaf-300 mt-0.5">Automated payroll, attendance deductions, advances deduction, and payment actions.</p>
            </div>
            
            <button 
              type="button" 
              onClick={() => {
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) document.documentElement.classList.remove('dark');
                document.body.classList.add('printing-payroll');
                setTimeout(() => {
                  window.print();
                  document.body.classList.remove('printing-payroll');
                  if (isDark) document.documentElement.classList.add('dark');
                }, 50);
              }}
              className="inline-flex items-center gap-1.5 bg-leaf-100 hover:bg-leaf-200 text-leaf-900 px-4 py-2 rounded-xl text-xs font-extrabold transition dark:bg-leaf-800 dark:hover:bg-leaf-700 dark:text-leaf-100"
            >
              <Printer size={13} /> Print Ledger
            </button>
          </div>

          <div className="print-header hidden mb-6 text-center text-black">
            <h1 className="text-3xl font-bold uppercase tracking-wider">Kaveri Nursery - Payroll Ledger</h1>
            <p className="text-lg mt-1 font-semibold">Month: {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="overflow-x-auto border border-leaf-700/10 rounded-2xl print-table-wrapper">
            <table className="w-full text-left text-xs whitespace-nowrap border-collapse bg-white dark:bg-leaf-950/20">
              <thead>
                <tr className="border-b border-leaf-700/20 font-bold uppercase text-soil dark:text-leaf-300 bg-leaf-50/50 dark:bg-leaf-900/40">
                  <th className="p-3.5 border-r border-leaf-700/10">Worker Name</th>
                  <th className="p-3 border-r border-leaf-700/10">Salary Rate</th>
                  <th className="p-3 border-r border-leaf-700/10 text-center">Worked Days</th>
                  <th className="p-3 border-r border-leaf-700/10 text-right">Gross Salary</th>
                  <th className="p-3 border-r border-leaf-700/10 text-right text-red-500">Absent Cuts</th>
                  <th className="p-3 border-r border-leaf-700/10 text-right text-green-700">Net Earned</th>
                  <th className="p-3 border-r border-leaf-700/10 text-right text-amber-600">Advance Taken</th>
                  <th className="p-3 border-r border-leaf-700/10 text-right text-green-800">Net Payable</th>
                  <th className="p-3 border-r border-leaf-700/10 text-right text-leaf-700">Amount Paid</th>
                  <th className="p-3 border-r border-leaf-700/10 text-right">Balance Due</th>
                  <th className="p-3 text-center no-print">ERP Actions</th>
                </tr>
              </thead>
              <tbody>
                {labours.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-6 text-center text-gray-500">No registered workers found to display payroll.</td>
                  </tr>
                ) : (
                  <>
                    {labours.map(labour => {
                      const totals = calculateTotals(labour.id);
                      const workedDays = totals.full + 0.5 * totals.half + (totals.custom || 0);
                      const standardWorkedDays = totals.full + 0.5 * totals.half;
                      
                      const salaryType = labour.salaryType || 'daily';
                      const salaryRate = labour.salaryRate || 0;
                      
                      let grossSalary = 0;
                      let salaryCut = 0;
                      let netSalary = 0;
                      
                      if (salaryType === 'monthly') {
                        grossSalary = salaryRate;
                        netSalary = Math.round((salaryRate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                        salaryCut = grossSalary - netSalary;
                      } else {
                        grossSalary = Math.round(salaryRate * (daysInMonth - (totals.custom || 0)) + (totals.customAmount || 0));
                        netSalary = Math.round(salaryRate * standardWorkedDays) + (totals.customAmount || 0);
                        salaryCut = grossSalary - netSalary;
                      }
                      
                      const labourAdvances = advances[labour.id] || [];
                      const totalAdvance = labourAdvances.reduce((sum, tx) => sum + tx.amount, 0);
                      const netPayable = netSalary - totalAdvance;
                      
                      const labourPayments = payments[labour.id] || [];
                      const totalPaid = labourPayments.reduce((sum, tx) => sum + tx.amount, 0);
                      const balanceDue = netPayable - totalPaid;
                      
                      return (
                        <tr key={labour.id} className="border-b border-leaf-700/10 hover:bg-cream/10 dark:hover:bg-leaf-900/20">
                          <td className="p-3 border-r border-leaf-700/10 font-bold">
                            {labour.name}
                            <span className="block text-xxs font-normal text-gray-500">{labour.skillType || labour.role || 'Gardener'}</span>
                          </td>
                          <td className="p-3 border-r border-leaf-700/10">
                            {salaryType === 'monthly' ? `₹${salaryRate.toLocaleString()}/m` : `₹${salaryRate.toLocaleString()}/d`}
                          </td>
                          <td className="p-3 border-r border-leaf-700/10 text-center font-bold">
                            {workedDays} <span className="text-xxs font-normal text-gray-400">/ {daysInMonth}d</span>
                          </td>
                          <td className="p-3 border-r border-leaf-700/10 text-right">₹{grossSalary.toLocaleString()}</td>
                          <td className="p-3 border-r border-leaf-700/10 text-right text-red-500 font-semibold">-₹{salaryCut.toLocaleString()}</td>
                          <td className="p-3 border-r border-leaf-700/10 text-right text-green-700 font-semibold">₹{netSalary.toLocaleString()}</td>
                          <td className="p-3 border-r border-leaf-700/10 text-right text-amber-600 font-semibold">₹{totalAdvance.toLocaleString()}</td>
                          <td className="p-3 border-r border-leaf-700/10 text-right text-green-800 font-extrabold">₹{netPayable.toLocaleString()}</td>
                          <td className="p-3 border-r border-leaf-700/10 text-right font-semibold text-leaf-700 dark:text-leaf-300">₹{totalPaid.toLocaleString()}</td>
                          <td className="p-3 border-r border-leaf-700/10 text-right font-extrabold">
                            <span className={balanceDue > 0 ? 'text-amber-600' : balanceDue < 0 ? 'text-red-500' : 'text-gray-500'}>
                              ₹{balanceDue.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 text-center no-print">
                            <div className="flex justify-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setPayingLabourId(labour.id);
                                  setPayForm({ amount: '', notes: '', date: new Date().toISOString().slice(0, 10) });
                                }}
                                className="inline-flex items-center gap-0.5 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded-lg text-xxs transition-colors"
                              >
                                <DollarSign size={10} /> Pay
                              </button>
                              <button 
                                onClick={() => {
                                  setRecordingAdvanceLabourId(labour.id);
                                  setAdvanceForm({ amount: '', notes: '', date: new Date().toISOString().slice(0, 10) });
                                }}
                                className="inline-flex items-center gap-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1 px-2 rounded-lg text-xxs transition-colors"
                              >
                                <Coins size={10} /> Advance
                              </button>
                              <button 
                                onClick={() => {
                                  setViewingHistoryLabourId(labour.id);
                                  setHistoryTab('payments');
                                }}
                                className="inline-flex items-center gap-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-leaf-800 dark:hover:bg-leaf-700 text-gray-800 dark:text-gray-200 py-1 px-2 rounded-lg text-xxs transition-colors"
                              >
                                <History size={10} /> Logs
                              </button>
                              <button 
                                onClick={() => setViewingSlipLabour(labour)}
                                className="inline-flex items-center gap-0.5 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded-lg text-xxs transition-colors"
                              >
                                <FileText size={10} /> Slip
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-leaf-50/50 dark:bg-leaf-900/40 font-bold border-t-2 border-leaf-700/20 text-[11px]">
                      <td className="p-3 border-r border-leaf-700/10 font-black uppercase text-soil dark:text-leaf-300">Grand Total</td>
                      <td className="p-3 border-r border-leaf-700/10 text-gray-400 font-normal">-</td>
                      <td className="p-3 border-r border-leaf-700/10 text-center font-bold">{payrollTotals.workedDays}d</td>
                      <td className="p-3 border-r border-leaf-700/10 text-right">₹{payrollTotals.grossSalary.toLocaleString()}</td>
                      <td className="p-3 border-r border-leaf-700/10 text-right text-red-500 font-bold">-₹{payrollTotals.salaryCut.toLocaleString()}</td>
                      <td className="p-3 border-r border-leaf-700/10 text-right text-green-700 font-bold">₹{payrollTotals.netSalary.toLocaleString()}</td>
                      <td className="p-3 border-r border-leaf-700/10 text-right text-amber-600 font-bold">₹{payrollTotals.totalAdvance.toLocaleString()}</td>
                      <td className="p-3 border-r border-leaf-700/10 text-right text-green-800 font-extrabold">₹{payrollTotals.netPayable.toLocaleString()}</td>
                      <td className="p-3 border-r border-leaf-700/10 text-right font-semibold text-leaf-700 dark:text-leaf-300">₹{payrollTotals.totalPaid.toLocaleString()}</td>
                      <td className="p-3 border-r border-leaf-700/10 text-right font-extrabold">
                        <span className={payrollTotals.balanceDue > 0 ? 'text-amber-600' : payrollTotals.balanceDue < 0 ? 'text-red-500' : 'text-gray-500'}>
                          ₹{payrollTotals.balanceDue.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center no-print"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Center Tab View */}
      {activeTab === 'reports' && (
        <div className="reports-section-wrap text-left">
          
          {/* Selector controls */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center no-print">
            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-leaf-900 dark:text-white uppercase shrink-0">Select Report:</span>
              <select 
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="rounded-xl border border-leaf-700/20 bg-cream/40 px-4 py-2 text-sm font-bold outline-none dark:bg-leaf-900 dark:border-leaf-800 focus:ring-2 focus:ring-leaf-500"
              >
                <option value="attendance">Monthly Attendance Report</option>
                <option value="salary">Monthly Salary Report</option>
                <option value="advance">Monthly Advances Report</option>
                <option value="payments">Monthly Payments History Report</option>
                <option value="performance">Worker Performance Summary</option>
              </select>
            </div>

            <button 
              onClick={printReport}
              className="inline-flex items-center gap-1.5 bg-leaf-600 hover:bg-leaf-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow"
            >
              <Printer size={13} /> Print Report Document
            </button>
          </div>

          {/* Printable Report Sheet */}
          <div className="glass rounded-[2rem] p-6 border border-leaf-700/10 bg-white text-leaf-900 dark:text-leaf-100">
            
            {/* Header section */}
            <div className="text-center border-b pb-5 mb-6">
              <h2 className="text-3xl font-black uppercase tracking-wider">Kaveri Nursery</h2>
              <p className="text-xs text-gray-500 uppercase font-bold mt-1">Nursery & Landscaping ERP System · Operations Report</p>
              <div className="mt-3 text-sm font-extrabold bg-gray-100 py-1.5 px-4 inline-block rounded-xl">
                {reportType === 'attendance' && 'MONTHLY ATTENDANCE REGISTER'}
                {reportType === 'salary' && 'MONTHLY SALARY LEDGER REPORT'}
                {reportType === 'advance' && 'MONTHLY ADVANCES LEDGER REPORT'}
                {reportType === 'payments' && 'MONTHLY PAYMENTS DISBURSEMENT LOG'}
                {reportType === 'performance' && 'WORKER PERFORMANCE & ATTENDANCE RATINGS'}
                {` — ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
              </div>
            </div>

            {/* Render 1: Monthly Attendance Report */}
            {reportType === 'attendance' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-leaf-800 bg-gray-50 dark:bg-leaf-900/40 text-gray-700 dark:text-leaf-300 font-bold uppercase">
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Skill Category</th>
                      <th className="p-3 text-center">Full Days (F)</th>
                      <th className="p-3 text-center">Half Days (H)</th>
                      <th className="p-3 text-center">Absent Days (A)</th>
                      <th className="p-3 text-center">Custom Days (C)</th>
                      <th className="p-3 text-center">Total Worked Days</th>
                      <th className="p-3 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labours.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-gray-500 dark:text-leaf-300">No attendance reports available.</td>
                      </tr>
                    ) : (
                      <>
                        {labours.map(labour => {
                          const totals = calculateTotals(labour.id);
                          const workedDays = totals.full + 0.5 * totals.half + (totals.custom || 0);
                          const attendancePercent = Math.min(100, Math.round((workedDays / daysInMonth) * 100));
                          return (
                            <tr key={labour.id} className="border-b border-gray-200 dark:border-leaf-800/40">
                              <td className="p-3 font-bold">{labour.name}</td>
                              <td className="p-3">{labour.skillType || labour.role || 'Gardener'}</td>
                              <td className="p-3 text-center text-green-700 dark:text-green-400 font-semibold">{totals.full}</td>
                              <td className="p-3 text-center text-amber-600 dark:text-amber-300 font-semibold">{totals.half}</td>
                              <td className="p-3 text-center text-red-650 dark:text-red-400 font-semibold">{totals.absent}</td>
                              <td className="p-3 text-center text-purple-650 dark:text-purple-400 font-semibold">{totals.custom || 0}</td>
                              <td className="p-3 text-center font-bold">{workedDays} Days</td>
                              <td className="p-3 text-right font-extrabold text-gray-800 dark:text-leaf-100">{attendancePercent}%</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-100 dark:bg-leaf-900/40 font-extrabold text-[11px] border-t-2 border-gray-400 dark:border-leaf-700">
                          <td className="p-3 uppercase">Grand Total</td>
                          <td className="p-3 text-gray-400 font-normal">-</td>
                          <td className="p-3 text-center text-green-700 dark:text-green-400 font-semibold">{grandTotals.full}</td>
                          <td className="p-3 text-center text-amber-600 dark:text-amber-300 font-semibold">{grandTotals.half}</td>
                          <td className="p-3 text-center text-red-650 dark:text-red-400 font-semibold">{grandTotals.absent}</td>
                          <td className="p-3 text-center text-purple-650 dark:text-purple-400 font-semibold">{grandTotals.custom}</td>
                          <td className="p-3 text-center">{payrollTotals.workedDays} Days</td>
                          <td className="p-3 text-right">
                            {(() => {
                              const avgPct = Math.min(100, Math.round(
                                (labours.reduce((sum, labour) => {
                                  const totals = calculateTotals(labour.id);
                                  const workedDays = totals.full + 0.5 * totals.half + (totals.custom || 0);
                                  return sum + (workedDays / daysInMonth);
                                }, 0) / labours.length) * 100
                              ));
                              return `${avgPct}%`;
                            })()}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 2: Monthly Salary Report */}
            {reportType === 'salary' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-leaf-800 bg-gray-50 dark:bg-leaf-900/40 text-gray-700 dark:text-leaf-300 font-bold uppercase">
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Rate Config</th>
                      <th className="p-3 text-center">Worked Days</th>
                      <th className="p-3 text-right">Gross Salary</th>
                      <th className="p-3 text-right text-red-600 dark:text-red-400">Absent Cuts</th>
                      <th className="p-3 text-right text-green-700 dark:text-green-400">Net Earned</th>
                      <th className="p-3 text-right text-amber-600 dark:text-amber-300">Advances</th>
                      <th className="p-3 text-right font-extrabold">Net Payable</th>
                      <th className="p-3 text-right text-gray-800 dark:text-leaf-100">Amount Paid</th>
                      <th className="p-3 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labours.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="p-4 text-center text-gray-500 dark:text-leaf-300">No salary reports available.</td>
                      </tr>
                    ) : (
                      <>
                        {labours.map(labour => {
                          const totals = calculateTotals(labour.id);
                          const workedDays = totals.full + 0.5 * totals.half + (totals.custom || 0);
                          const standardWorkedDays = totals.full + 0.5 * totals.half;
                          const salaryRate = labour.salaryRate || 0;
                          const salaryType = labour.salaryType || 'daily';
                          
                          let grossSalary = 0;
                          let salaryCut = 0;
                          let netSalary = 0;
                          
                          if (salaryType === 'monthly') {
                            grossSalary = salaryRate;
                            netSalary = Math.round((salaryRate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                            salaryCut = grossSalary - netSalary;
                          } else {
                            grossSalary = Math.round(salaryRate * (daysInMonth - (totals.custom || 0)) + (totals.customAmount || 0));
                            netSalary = Math.round(salaryRate * standardWorkedDays) + (totals.customAmount || 0);
                            salaryCut = grossSalary - netSalary;
                          }
                          
                          const labourAdvances = advances[labour.id] || [];
                          const totalAdvance = labourAdvances.reduce((sum, tx) => sum + tx.amount, 0);
                          const netPayable = netSalary - totalAdvance;
                          
                          const labourPayments = payments[labour.id] || [];
                          const totalPaid = labourPayments.reduce((sum, tx) => sum + tx.amount, 0);
                          const balanceDue = netPayable - totalPaid;
                          
                          return (
                            <tr key={labour.id} className="border-b border-gray-200 dark:border-leaf-800/40">
                              <td className="p-3 font-bold">
                                {labour.name}
                                <span className="block text-xxs font-normal text-gray-400 dark:text-leaf-300/60">{labour.skillType || labour.role || 'Gardener'}</span>
                              </td>
                              <td className="p-3">
                                ₹{salaryRate}/{salaryType === 'monthly' ? 'm' : 'd'}
                              </td>
                              <td className="p-3 text-center font-bold">{workedDays} Days</td>
                              <td className="p-3 text-right">₹{grossSalary.toLocaleString()}</td>
                              <td className="p-3 text-right text-red-650 dark:text-red-400 font-semibold">-₹{salaryCut.toLocaleString()}</td>
                              <td className="p-3 text-right text-green-700 dark:text-green-400 font-semibold">₹{netSalary.toLocaleString()}</td>
                              <td className="p-3 text-right text-amber-600 dark:text-amber-300 font-semibold">₹{totalAdvance.toLocaleString()}</td>
                              <td className="p-3 text-right font-extrabold">₹{netPayable.toLocaleString()}</td>
                              <td className="p-3 text-right text-gray-700 dark:text-leaf-200">₹{totalPaid.toLocaleString()}</td>
                              <td className="p-3 text-right font-extrabold text-blue-700 dark:text-blue-300">₹{balanceDue.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-100 dark:bg-leaf-900/40 font-extrabold text-[11px] border-t-2 border-gray-400 dark:border-leaf-700">
                          <td className="p-3 uppercase">Grand Total</td>
                          <td className="p-3 text-gray-400 font-normal">-</td>
                          <td className="p-3 text-center">{payrollTotals.workedDays} Days</td>
                          <td className="p-3 text-right">₹{payrollTotals.grossSalary.toLocaleString()}</td>
                          <td className="p-3 text-right text-red-655 dark:text-red-400 font-semibold">-₹{payrollTotals.salaryCut.toLocaleString()}</td>
                          <td className="p-3 text-right text-green-700 dark:text-green-400 font-semibold">₹{payrollTotals.netSalary.toLocaleString()}</td>
                          <td className="p-3 text-right text-amber-600 dark:text-amber-300 font-semibold">₹{payrollTotals.totalAdvance.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold">₹{payrollTotals.netPayable.toLocaleString()}</td>
                          <td className="p-3 text-right text-gray-700 dark:text-leaf-200">₹{payrollTotals.totalPaid.toLocaleString()}</td>
                          <td className="p-3 text-right font-extrabold text-blue-700 dark:text-blue-300">₹{payrollTotals.balanceDue.toLocaleString()}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 3: Advance Report */}
            {reportType === 'advance' && (
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-leaf-800 bg-gray-50 dark:bg-leaf-900/40 text-gray-700 dark:text-leaf-300 font-bold uppercase">
                      <th className="p-3 w-32">Date Given</th>
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Skill Category</th>
                      <th className="p-3">Reason / Remarks</th>
                      <th className="p-3 text-right">Advance Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const allTx = [];
                      Object.keys(advances).forEach(labId => {
                        const worker = labours.find(l => l.id === labId);
                        advances[labId].forEach(tx => {
                          allTx.push({
                            ...tx,
                            workerName: worker?.name || 'Deleted Worker',
                            workerSkill: worker?.skillType || worker?.role || 'Gardener'
                          });
                        });
                      });

                      if (allTx.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" className="p-4 text-center text-gray-500 dark:text-leaf-300">No salary advances recorded for this month.</td>
                          </tr>
                        );
                      }

                      const sorted = allTx.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      const totalSum = sorted.reduce((sum, entry) => sum + entry.amount, 0);

                      return (
                        <>
                          {sorted.map(entry => (
                            <tr key={entry.id} className="border-b border-gray-200 dark:border-leaf-800/40">
                              <td className="p-3">{entry.date}</td>
                              <td className="p-3 font-bold">{entry.workerName}</td>
                              <td className="p-3">{entry.workerSkill}</td>
                              <td className="p-3 italic text-gray-600 dark:text-leaf-300">{entry.notes}</td>
                              <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-300">₹{entry.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 dark:bg-leaf-900/40 font-extrabold text-sm border-t-2 border-gray-400 dark:border-leaf-700">
                            <td className="p-3 text-right" colSpan="4">GRAND TOTAL ADVANCES:</td>
                            <td className="p-3 text-right text-amber-700 dark:text-amber-300">₹{totalSum.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 4: Payment History Report */}
            {reportType === 'payments' && (
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-leaf-800 bg-gray-50 dark:bg-leaf-900/40 text-gray-700 dark:text-leaf-300 font-bold uppercase">
                      <th className="p-3 w-32">Disbursement Date</th>
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Skill Category</th>
                      <th className="p-3">Remarks / Notes</th>
                      <th className="p-3 text-right">Amount Disbursed (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const allTx = [];
                      Object.keys(payments).forEach(labId => {
                        const worker = labours.find(l => l.id === labId);
                        payments[labId].forEach(tx => {
                          allTx.push({
                            ...tx,
                            workerName: worker?.name || 'Deleted Worker',
                            workerSkill: worker?.skillType || worker?.role || 'Gardener'
                          });
                        });
                      });

                      if (allTx.length === 0) {
                        return (
                          <tr>
                            <td colSpan="5" className="p-4 text-center text-gray-500 dark:text-leaf-300">No salary payment disbursements found for this month.</td>
                          </tr>
                        );
                      }

                      const sorted = allTx.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      const totalSum = sorted.reduce((sum, entry) => sum + entry.amount, 0);

                      return (
                        <>
                          {sorted.map(entry => (
                            <tr key={entry.id} className="border-b border-gray-200 dark:border-leaf-800/40">
                              <td className="p-3">{entry.date}</td>
                              <td className="p-3 font-bold">{entry.workerName}</td>
                              <td className="p-3">{entry.workerSkill}</td>
                              <td className="p-3 italic text-gray-600 dark:text-leaf-300">{entry.notes}</td>
                              <td className="p-3 text-right font-bold text-green-700 dark:text-green-400">₹{entry.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 dark:bg-leaf-900/40 font-extrabold text-sm border-t-2 border-gray-400 dark:border-leaf-700">
                            <td className="p-3 text-right" colSpan="4">GRAND TOTAL DISBURSED:</td>
                            <td className="p-3 text-right text-green-800 dark:text-leaf-200">₹{totalSum.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 5: Worker Performance Summary */}
            {reportType === 'performance' && (
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-leaf-800 bg-gray-50 dark:bg-leaf-900/40 text-gray-700 dark:text-leaf-300 font-bold uppercase">
                      <th className="p-3">Worker Photo & Name</th>
                      <th className="p-3">Skill Category</th>
                      <th className="p-3 text-center">Days Worked (F + 0.5*H)</th>
                      <th className="p-3 text-center">Attendance %</th>
                      <th className="p-3 text-right">Net Earnings (₹)</th>
                      <th className="p-3 text-center">Attendance Performance Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labours.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500 dark:text-leaf-300">No worker performance records available.</td>
                      </tr>
                    ) : (
                      <>
                        {labours.map(labour => {
                          const totals = calculateTotals(labour.id);
                          const workedDays = totals.full + 0.5 * totals.half + (totals.custom || 0);
                          const standardWorkedDays = totals.full + 0.5 * totals.half;
                          const attendancePercent = Math.min(100, Math.round((workedDays / daysInMonth) * 100));
                          
                          const salaryType = labour.salaryType || 'daily';
                          const salaryRate = labour.salaryRate || 0;
                          let netSalary = 0;
                          if (salaryType === 'monthly') {
                            netSalary = Math.round((salaryRate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                          } else {
                            netSalary = Math.round(salaryRate * standardWorkedDays) + (totals.customAmount || 0);
                          }

                          const rating = getPerformanceRating(workedDays);

                          return (
                            <tr key={labour.id} className="border-b border-gray-200 dark:border-leaf-800/40">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={labour.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'} 
                                    alt={labour.name} 
                                    className="h-8 w-8 rounded-full object-cover border border-leaf-700/10"
                                  />
                                  <div>
                                    <strong className="text-gray-900 dark:text-leaf-100 block">{labour.name}</strong>
                                    <span className="text-xxs text-gray-500 dark:text-leaf-300/60">Aadhaar: {labour.aadhaar ? `XXXX XXXX ${labour.aadhaar.slice(8,12)}` : 'N/A'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-semibold">{labour.skillType || labour.role || 'Gardener'}</td>
                              <td className="p-3 text-center font-bold">{workedDays} / {daysInMonth} Days</td>
                              <td className="p-3 text-center font-extrabold text-blue-700 dark:text-blue-300">{attendancePercent}%</td>
                              <td className="p-3 text-right font-extrabold text-green-700 dark:text-green-400">₹{netSalary.toLocaleString()}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xxs font-extrabold uppercase ${rating.style}`}>
                                  {rating.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-100 dark:bg-leaf-900/40 font-extrabold text-[11px] border-t-2 border-gray-400 dark:border-leaf-700">
                          <td className="p-3 uppercase">Grand Total</td>
                          <td className="p-3 text-gray-400 font-normal">-</td>
                          <td className="p-3 text-center font-bold">{payrollTotals.workedDays} / {daysInMonth * labours.length} Days</td>
                          <td className="p-3 text-center font-extrabold">
                            {(() => {
                              const avgPct = Math.min(100, Math.round(
                                (labours.reduce((sum, labour) => {
                                  const totals = calculateTotals(labour.id);
                                  const workedDays = totals.full + 0.5 * totals.half + (totals.custom || 0);
                                  return sum + (workedDays / daysInMonth);
                                }, 0) / labours.length) * 100
                              ));
                              return `${avgPct}%`;
                            })()}
                          </td>
                          <td className="p-3 text-right text-green-700 dark:text-green-400 font-extrabold">₹{payrollTotals.netSalary.toLocaleString()}</td>
                          <td className="p-3 text-center text-gray-400 font-normal">-</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Blocks */}
            <div className="mt-16 grid grid-cols-2 gap-12 text-center text-sm border-t border-dashed pt-8">
              <div>
                <div className="border-t-2 border-gray-400 w-48 mx-auto pt-2">
                  <p className="text-gray-600 font-bold text-xs uppercase">Prepared By (Operator)</p>
                </div>
              </div>
              <div>
                <div className="border-t-2 border-gray-400 w-48 mx-auto pt-2">
                  <p className="text-gray-600 font-bold text-xs uppercase">Authorized Signature (Owner)</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-xxs text-gray-400 font-semibold italic border-t pt-4">
              Report generated dynamically from Kaveri Nursery ERP Database. Printed on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Labourer Modal Overlay */}
      {editingLabour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[2.5rem] bg-white p-6 shadow-2xl dark:bg-leaf-900 border border-leaf-700/10 text-left">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2 text-leaf-900 dark:text-white">
                <Edit size={20} className="text-leaf-650" /> Edit Worker Profile
              </h3>
              <button 
                onClick={() => setEditingLabour(null)} 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={updateLabour} className="space-y-4">
              {/* Photo Upload selector */}
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Worker Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-leaf-700/10 bg-leaf-50 dark:bg-leaf-800">
                    {editingLabour.photoPreview || editingLabour.photoUrl ? (
                      <img src={editingLabour.photoPreview || editingLabour.photoUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs font-bold text-leaf-500">No Photo</div>
                    )}
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 rounded-xl bg-leaf-100 px-4 py-2 text-xs font-bold text-leaf-800 hover:bg-leaf-200 dark:bg-leaf-800 dark:text-leaf-200 dark:hover:bg-leaf-700 transition">
                    <Upload size={14} /> Update Photo
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoSelect(e, true)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Full Name *</label>
                <input 
                  type="text" 
                  value={editingLabour.name} 
                  onChange={e => setEditingLabour({ ...editingLabour, name: e.target.value })} 
                  className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Skill Type *</label>
                  <select 
                    value={editingLabour.skillType || editingLabour.role || 'Gardener'} 
                    onChange={e => setEditingLabour({ ...editingLabour, skillType: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2.5 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm"
                  >
                    <option value="Gardener">Gardener</option>
                    <option value="Landscaper">Landscaper</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Helper">Helper</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Joining Date</label>
                  <input 
                    type="date" 
                    value={editingLabour.joiningDate || ''} 
                    onChange={e => setEditingLabour({ ...editingLabour, joiningDate: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Mobile *</label>
                  <input 
                    type="text" 
                    maxLength="10"
                    value={editingLabour.phone || ''} 
                    onChange={e => setEditingLabour({ ...editingLabour, phone: e.target.value.replace(/\D/g, '') })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Aadhaar No. *</label>
                  <input 
                    type="text" 
                    maxLength="12"
                    value={editingLabour.aadhaar || ''} 
                    onChange={e => setEditingLabour({ ...editingLabour, aadhaar: e.target.value.replace(/\D/g, '') })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Salary Type</label>
                  <select 
                    value={editingLabour.salaryType || 'daily'} 
                    onChange={e => setEditingLabour({ ...editingLabour, salaryType: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2.5 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm"
                  >
                    <option value="daily">Daily Wage</option>
                    <option value="monthly">Monthly Salary</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Rate (₹) *</label>
                  <input 
                    type="number" 
                    value={editingLabour.salaryRate || ''} 
                    onChange={e => setEditingLabour({ ...editingLabour, salaryRate: e.target.value })} 
                    className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Home Address</label>
                <textarea 
                  value={editingLabour.address || ''} 
                  onChange={e => setEditingLabour({ ...editingLabour, address: e.target.value })} 
                  rows="2"
                  className="w-full rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none text-leaf-900 dark:text-leaf-100 dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm resize-none" 
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingLabour(null)} 
                  className="btn-secondary px-5 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="btn-primary px-5 py-2 text-xs font-bold bg-leaf-650 hover:bg-leaf-750 text-white border-none"
                >
                  {uploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Daily Wage Modal Overlay */}
      {customWageInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-6 shadow-2xl dark:bg-leaf-900 border border-leaf-700/10 text-left text-leaf-900 dark:text-leaf-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2 text-purple-650 dark:text-purple-400">
                <DollarSign size={20} /> {customWageInput.isNew ? "Enter Custom Daily Wage" : "Edit Custom Daily Wage"}
              </h3>
              <button onClick={() => setCustomWageInput(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-leaf-300/80 mb-4">Set custom wage for <strong>{customWageInput.name}</strong> on day <strong>{customWageInput.day}</strong>.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const amount = Number(customWageInput.currentAmount);
              if (isNaN(amount) || amount < 0) {
                alert("Please enter a valid wage amount.");
                return;
              }
              await updateAttendanceStatus(customWageInput.labourId, customWageInput.day, 'Custom', amount);
              setCustomWageInput(null);
            }} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Wage Amount (₹)</label>
                <input 
                  type="number" 
                  value={customWageInput.currentAmount} 
                  onChange={e => setCustomWageInput({ ...customWageInput, currentAmount: e.target.value })} 
                  className="rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" 
                  placeholder="Enter amount" 
                  required 
                />
              </div>
              <div className="mt-6 flex justify-between border-t pt-4">
                <div>
                  {!customWageInput.isNew && (
                    <button 
                      type="button" 
                      onClick={async () => {
                        await updateAttendanceStatus(customWageInput.labourId, customWageInput.day, null);
                        setCustomWageInput(null);
                      }} 
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-red-500/20 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition"
                    >
                      Clear Status
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setCustomWageInput(null)} className="btn-secondary text-xs font-bold px-4 py-2">Cancel</button>
                  <button type="submit" className="btn-primary bg-purple-650 hover:bg-purple-750 border-none text-xs font-bold px-4 py-2 text-white">Save Wage</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Salary Payment Modal Overlay */}
      {payingLabourId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-6 shadow-2xl dark:bg-leaf-900 border border-leaf-700/10 text-left text-leaf-900 dark:text-leaf-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2"><DollarSign size={20} className="text-green-600" /> Record Wage Payment</h3>
              <button onClick={() => setPayingLabourId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-leaf-300/80 mb-4">Record a salary payment for <strong>{labours.find(l => l.id === payingLabourId)?.name}</strong> for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
            
            <form onSubmit={recordPayment} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Payment Date</label>
                <input type="date" value={payForm.date} onChange={e=>setPayForm({...payForm, date: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" required />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Disbursed Amount (₹)</label>
                <input type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm, amount: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" placeholder="Enter amount paid" required />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Remarks / Notes</label>
                <input value={payForm.notes} onChange={e=>setPayForm({...payForm, notes: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" placeholder="e.g. UPI, Cash, Final Settlement" />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setPayingLabourId(null)} className="btn-secondary text-xs font-bold px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary bg-green-600 hover:bg-green-700 border-none text-xs font-bold px-4 py-2 text-white">Record Disbursal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Salary Advance Modal Overlay */}
      {recordingAdvanceLabourId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-6 shadow-2xl dark:bg-leaf-900 border border-leaf-700/10 text-left text-leaf-900 dark:text-leaf-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2 text-amber-600"><Coins size={20} /> Record Salary Advance</h3>
              <button onClick={() => setRecordingAdvanceLabourId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-leaf-300/80 mb-4">Record a wage advance given to <strong>{labours.find(l => l.id === recordingAdvanceLabourId)?.name}</strong> for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
            
            <form onSubmit={recordAdvance} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Advance Date</label>
                <input type="date" value={advanceForm.date} onChange={e=>setAdvanceForm({...advanceForm, date: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" required />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Advance Amount (₹)</label>
                <input type="number" value={advanceForm.amount} onChange={e=>setAdvanceForm({...advanceForm, amount: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" placeholder="Enter advance amount" required />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-leaf-700 dark:text-leaf-300 uppercase">Notes / Purpose *</label>
                <input value={advanceForm.notes} onChange={e=>setAdvanceForm({...advanceForm, notes: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-cream/20 px-4 py-2 outline-none dark:bg-leaf-900 focus:ring-2 focus:ring-leaf-500 text-sm" placeholder="e.g. Festival advance, Medical needs" required />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setRecordingAdvanceLabourId(null)} className="btn-secondary text-xs font-bold px-4 py-2">Cancel</button>
                <button type="submit" className="btn-primary bg-amber-600 hover:bg-amber-700 border-none text-xs font-bold px-4 py-2 text-white">Record Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Logs Modal Overlay */}
      {viewingHistoryLabourId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 no-print animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-6 shadow-2xl dark:bg-leaf-900 border border-leaf-700/10 text-left text-leaf-900 dark:text-leaf-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2"><History size={20} className="text-leaf-600" /> Transaction Ledger Logs</h3>
              <button onClick={() => setViewingHistoryLabourId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-leaf-300/80 mb-4">Transactions for <strong>{labours.find(l => l.id === viewingHistoryLabourId)?.name}</strong> in {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
            
            {/* Tabs Header */}
            <div className="flex border-b border-leaf-700/10 mb-4">
              <button 
                type="button" 
                onClick={() => setHistoryTab('payments')}
                className={`flex-1 py-2 font-bold text-xs text-center border-b-2 transition-all ${historyTab === 'payments' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
              >
                Payments Disbursed
              </button>
              <button 
                type="button" 
                onClick={() => setHistoryTab('advances')}
                className={`flex-1 py-2 font-bold text-xs text-center border-b-2 transition-all ${historyTab === 'advances' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
              >
                Advances Given
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {historyTab === 'payments' ? (
                !payments[viewingHistoryLabourId] || payments[viewingHistoryLabourId].length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-leaf-300/60 text-center py-6 italic">No payment logs found for this month.</p>
                ) : (
                  payments[viewingHistoryLabourId].map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center bg-green-50/40 p-3 rounded-xl border border-green-700/5 dark:bg-green-950/10">
                      <div>
                        <p className="font-extrabold text-sm text-green-700 dark:text-green-400">₹{tx.amount}</p>
                        <p className="text-xxs text-gray-500 dark:text-leaf-300/70 mt-0.5">{tx.date} · {tx.notes}</p>
                      </div>
                      <button 
                        onClick={() => deletePayment(viewingHistoryLabourId, tx.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )
              ) : (
                !advances[viewingHistoryLabourId] || advances[viewingHistoryLabourId].length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-leaf-300/60 text-center py-6 italic">No advance logs found for this month.</p>
                ) : (
                  advances[viewingHistoryLabourId].map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center bg-amber-50/40 p-3 rounded-xl border border-amber-700/5 dark:bg-amber-950/10">
                      <div>
                        <p className="font-extrabold text-sm text-amber-700 dark:text-amber-400">₹{tx.amount}</p>
                        <p className="text-xxs text-gray-500 dark:text-leaf-300/70 mt-0.5">{tx.date} · {tx.notes}</p>
                      </div>
                      <button 
                        onClick={() => deleteAdvance(viewingHistoryLabourId, tx.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
            
            <div className="mt-6 flex justify-end border-t pt-4">
              <button onClick={() => setViewingHistoryLabourId(null)} className="btn-secondary text-xs font-bold px-4 py-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Slip Modal Portal (Isolates print overlay cleanly) */}
      {viewingSlipLabour && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print-slip-overlay no-print">
          <div className="relative w-full max-w-xl rounded-[2.5rem] bg-white p-6 shadow-2xl dark:bg-leaf-900 border border-leaf-700/10 text-left text-leaf-900 dark:text-leaf-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2"><FileText size={20} className="text-leaf-600" /> Salary Slip Preview</h3>
              <button onClick={() => setViewingSlipLabour(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-2 mb-6">
              <div className="print-slip-paper p-6 border border-gray-200 dark:border-leaf-800 bg-white rounded-2xl text-black">
                <div className="text-center border-b pb-4 mb-4">
                  <h2 className="text-2xl font-black uppercase tracking-wider">Kaveri Nursery</h2>
                  <p className="text-xs text-gray-500">Mhasrul, Nashik - 422004</p>
                  <p className="text-xs text-gray-500">Operations Support: +91 9876543210</p>
                  <div className="mt-3 text-xs font-extrabold bg-gray-150 py-1.5 px-4 inline-block rounded">
                    SALARY SLIP - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-5 pb-4 border-b">
                  <img 
                    src={viewingSlipLabour.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                    alt={viewingSlipLabour.name} 
                    className="h-16 w-16 rounded-full object-cover border"
                  />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xxs flex-1">
                    <div>
                      <span className="text-gray-400 block font-bold">Worker Name</span>
                      <strong className="text-xs text-gray-800">{viewingSlipLabour.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold">Skill / Role</span>
                      <strong className="text-xs text-gray-800">{viewingSlipLabour.skillType || viewingSlipLabour.role || 'Gardener'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold">Mobile</span>
                      <strong className="text-xs text-gray-800">{viewingSlipLabour.phone || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-bold">Salary Config</span>
                      <strong className="text-xs text-gray-800">
                        ₹{Number(viewingSlipLabour.salaryRate || 0).toLocaleString()} / {viewingSlipLabour.salaryType === 'monthly' ? 'Month' : 'Day'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-gray-55 p-3 rounded-lg mb-4 text-xxs border">
                  <h4 className="font-black mb-1.5 text-gray-500 uppercase tracking-wider">Attendance Breakdown</h4>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div>
                      <span className="block text-gray-400">Full Days</span>
                      <strong className="text-sm text-green-700">{calculateTotals(viewingSlipLabour.id).full}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">Half Days</span>
                      <strong className="text-sm text-amber-600">{calculateTotals(viewingSlipLabour.id).half}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">Absent Days</span>
                      <strong className="text-sm text-red-600">{calculateTotals(viewingSlipLabour.id).absent}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">Custom Days</span>
                      <strong className="text-sm text-purple-600">{calculateTotals(viewingSlipLabour.id).custom || 0}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400">Worked Days</span>
                      <strong className="text-sm text-blue-700">
                        {calculateTotals(viewingSlipLabour.id).full + 0.5 * calculateTotals(viewingSlipLabour.id).half + (calculateTotals(viewingSlipLabour.id).custom || 0)} / {daysInMonth}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Payroll Details */}
                <table className="w-full text-xxs text-left border-collapse mb-4">
                  <thead>
                    <tr className="border-b bg-gray-100 text-gray-600 font-bold uppercase">
                      <th className="p-2">Transaction Description</th>
                      <th className="p-2 text-right">Credit Earnings (₹)</th>
                      <th className="p-2 text-right">Debit Deductions (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-semibold">Gross Salary Rate</td>
                      <td className="p-2 text-right">
                        {(() => {
                          const totals = calculateTotals(viewingSlipLabour.id);
                          const rate = Number(viewingSlipLabour.salaryRate || 0);
                          if (viewingSlipLabour.salaryType === 'monthly') {
                            return rate.toLocaleString();
                          } else {
                            return Math.round(rate * (daysInMonth - (totals.custom || 0)) + (totals.customAmount || 0)).toLocaleString();
                          }
                        })()}
                      </td>
                      <td className="p-2 text-right">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Absent Day Cuts</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right text-red-600">
                        {(() => {
                          const totals = calculateTotals(viewingSlipLabour.id);
                          const standardWorkedDays = totals.full + 0.5 * totals.half;
                          const rate = Number(viewingSlipLabour.salaryRate || 0);
                          let gross = 0;
                          let net = 0;
                          if (viewingSlipLabour.salaryType === 'monthly') {
                            gross = rate;
                            net = Math.round((rate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                          } else {
                            gross = rate * (daysInMonth - (totals.custom || 0)) + (totals.customAmount || 0);
                            net = rate * standardWorkedDays + (totals.customAmount || 0);
                          }
                          return Math.round(gross - net).toLocaleString();
                        })()}
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-50/50 font-bold">
                      <td className="p-2">Net Salary Earned</td>
                      <td className="p-2 text-right text-green-700">
                        {(() => {
                          const totals = calculateTotals(viewingSlipLabour.id);
                          const standardWorkedDays = totals.full + 0.5 * totals.half;
                          const rate = Number(viewingSlipLabour.salaryRate || 0);
                          let net = 0;
                          if (viewingSlipLabour.salaryType === 'monthly') {
                            net = Math.round((rate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                          } else {
                            net = rate * standardWorkedDays + (totals.customAmount || 0);
                          }
                          return net.toLocaleString();
                        })()}
                      </td>
                      <td className="p-2 text-right">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-amber-700 font-semibold">Total Advances Deducted</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right font-bold text-amber-700">
                        {Number((advances[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-semibold text-green-700">Salary Disbursed (Paid)</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right font-bold text-green-750">
                        {Number((payments[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-t-2 font-extrabold bg-gray-100 text-xs">
                      <td className="p-2">Balance Salary Due</td>
                      <td className="p-2 text-right text-blue-700" colSpan="2">
                        {(() => {
                          const totals = calculateTotals(viewingSlipLabour.id);
                          const standardWorkedDays = totals.full + 0.5 * totals.half;
                          const rate = Number(viewingSlipLabour.salaryRate || 0);
                          let net = 0;
                          if (viewingSlipLabour.salaryType === 'monthly') {
                            net = Math.round((rate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                          } else {
                            net = rate * standardWorkedDays + (totals.customAmount || 0);
                          }
                          const totalAdv = (advances[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0);
                          const totalPaid = (payments[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0);
                          return `₹ ${(net - totalAdv - totalPaid).toLocaleString()}`;
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signature Blocks */}
                <div className="mt-8 pt-6 grid grid-cols-2 gap-8 text-center text-xxs">
                  <div className="border-t border-dashed pt-1.5">
                    <p className="text-gray-500 uppercase font-bold">Worker Signature</p>
                  </div>
                  <div className="border-t border-dashed pt-1.5">
                    <p className="text-gray-500 uppercase font-bold">Authorized signature</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 no-print">
              <button type="button" onClick={() => setViewingSlipLabour(null)} className="btn-secondary px-4 py-2 text-xs font-bold">Close</button>
              <button 
                type="button" 
                onClick={() => {
                  const isDark = document.documentElement.classList.contains('dark');
                  if (isDark) document.documentElement.classList.remove('dark');
                  document.body.classList.add('printing-slip');
                  setTimeout(() => {
                    window.print();
                    document.body.classList.remove('printing-slip');
                    if (isDark) document.documentElement.classList.add('dark');
                  }, 50);
                }} 
                className="btn-primary flex items-center gap-1 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 border-none text-white shadow-sm"
              >
                <Printer size={13} /> Print Salary Slip
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Render the actual clean document for print-only outside React layout structure (hidden on screen) */}
      {viewingSlipLabour && (
        <div className="print-slip-only hidden text-black bg-white p-6 font-sans">
          <div className="text-center border-b-2 pb-4 mb-6">
            <h2 className="text-3xl font-extrabold tracking-wide uppercase">Kaveri Nursery</h2>
            <p className="text-sm text-gray-600">Mhasrul, Nashik - 422004</p>
            <p className="text-sm text-gray-600">Phone: +91 9876543210</p>
            <div className="mt-3 text-lg font-bold bg-gray-150 py-1.5 px-4 inline-block rounded">
              SALARY SLIP - {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-start gap-6 mb-6 border-b pb-4">
            <img 
              src={viewingSlipLabour.photoUrl} 
              alt={viewingSlipLabour.name} 
              className="h-20 w-20 rounded-full object-cover border-2"
            />
            <div className="grid grid-cols-2 gap-6 text-sm flex-1">
              <div>
                <span className="text-gray-500 block">Labour Name:</span>
                <strong className="text-lg text-gray-900">{viewingSlipLabour.name}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Designation / Skill Category:</span>
                <strong className="text-lg text-gray-900">{viewingSlipLabour.skillType || viewingSlipLabour.role || 'Gardener'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Phone:</span>
                <strong className="text-lg text-gray-900">{viewingSlipLabour.phone || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-gray-505 block">Salary Configuration:</span>
                <strong className="text-lg text-gray-900">
                  ₹{Number(viewingSlipLabour.salaryRate || 0).toLocaleString()} / {viewingSlipLabour.salaryType === 'monthly' ? 'Month' : 'Day'}
                </strong>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm">
            <h4 className="font-bold mb-2 text-gray-700 uppercase">Attendance Summary</h4>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <span className="block text-gray-500">Full Days</span>
                <strong className="text-base text-green-700">{calculateTotals(viewingSlipLabour.id).full}</strong>
              </div>
              <div>
                <span className="block text-gray-500">Half Days</span>
                <strong className="text-base text-yellow-600">{calculateTotals(viewingSlipLabour.id).half}</strong>
              </div>
              <div>
                <span className="block text-gray-505">Absent Days</span>
                <strong className="text-base text-red-600">{calculateTotals(viewingSlipLabour.id).absent}</strong>
              </div>
              <div>
                <span className="block text-gray-505">Custom Days</span>
                <strong className="text-base text-purple-650">{calculateTotals(viewingSlipLabour.id).custom || 0}</strong>
              </div>
              <div>
                <span className="block text-gray-505">Worked Days</span>
                <strong className="text-base text-blue-700">
                  {calculateTotals(viewingSlipLabour.id).full + 0.5 * calculateTotals(viewingSlipLabour.id).half + (calculateTotals(viewingSlipLabour.id).custom || 0)} / {daysInMonth}
                </strong>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Breakdown */}
          <table className="w-full text-sm text-left border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-100 text-gray-700 font-bold">
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Earnings (₹)</th>
                <th className="p-3 text-right">Deductions (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-3 font-semibold">Gross Salary (Based on month duration)</td>
                <td className="p-3 text-right">
                  {(() => {
                    const totals = calculateTotals(viewingSlipLabour.id);
                    const rate = Number(viewingSlipLabour.salaryRate || 0);
                    if (viewingSlipLabour.salaryType === 'monthly') {
                      return rate.toLocaleString();
                    } else {
                      return Math.round(rate * (daysInMonth - (totals.custom || 0)) + (totals.customAmount || 0)).toLocaleString();
                    }
                  })()}
                </td>
                <td className="p-3 text-right">-</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3">Attendance Cut (Absent/Half Days)</td>
                <td className="p-3 text-right">-</td>
                <td className="p-3 text-right text-red-650 font-semibold">
                  {(() => {
                    const totals = calculateTotals(viewingSlipLabour.id);
                    const standardWorkedDays = totals.full + 0.5 * totals.half;
                    const rate = Number(viewingSlipLabour.salaryRate || 0);
                    let gross = 0;
                    let net = 0;
                    if (viewingSlipLabour.salaryType === 'monthly') {
                      gross = rate;
                      net = Math.round((rate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                    } else {
                      gross = rate * (daysInMonth - (totals.custom || 0)) + (totals.customAmount || 0);
                      net = rate * standardWorkedDays + (totals.customAmount || 0);
                    }
                    return Math.round(gross - net).toLocaleString();
                  })()}
                </td>
              </tr>
              <tr className="border-b border-gray-200 font-bold bg-gray-50">
                <td className="p-3">Net Salary Earned</td>
                <td className="p-3 text-right text-green-700">
                  {(() => {
                    const totals = calculateTotals(viewingSlipLabour.id);
                    const standardWorkedDays = totals.full + 0.5 * totals.half;
                    const rate = Number(viewingSlipLabour.salaryRate || 0);
                    let net = 0;
                    if (viewingSlipLabour.salaryType === 'monthly') {
                      net = Math.round((rate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                    } else {
                      net = rate * standardWorkedDays + (totals.customAmount || 0);
                    }
                    return net.toLocaleString();
                  })()}
                </td>
                <td className="p-3 text-right">-</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 text-amber-805 font-semibold">Salary Advances Taken (Deducted)</td>
                <td className="p-3 text-right">-</td>
                <td className="p-3 text-right font-bold text-amber-700">
                  {Number((advances[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-3 font-semibold">Salary Payments Received</td>
                <td className="p-3 text-right">-</td>
                <td className="p-3 text-right font-bold text-green-750">
                  {Number((payments[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()}
                </td>
              </tr>
              <tr className="border-t-2 border-gray-400 font-extrabold bg-gray-100 text-base">
                <td className="p-3">Balance Salary Due</td>
                <td className="p-3 text-right text-blue-700" colSpan="2">
                  {(() => {
                    const totals = calculateTotals(viewingSlipLabour.id);
                    const standardWorkedDays = totals.full + 0.5 * totals.half;
                    const rate = Number(viewingSlipLabour.salaryRate || 0);
                    let net = 0;
                    if (viewingSlipLabour.salaryType === 'monthly') {
                      net = Math.round((rate / daysInMonth) * standardWorkedDays) + (totals.customAmount || 0);
                    } else {
                      net = rate * standardWorkedDays + (totals.customAmount || 0);
                    }
                    const totalAdv = (advances[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0);
                    const totalPaid = (payments[viewingSlipLabour.id] || []).reduce((sum, tx) => sum + tx.amount, 0);
                    return `₹ ${(net - totalAdv - totalPaid).toLocaleString()}`;
                  })()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Advance Details */}
          {(advances[viewingSlipLabour.id] || []).length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-amber-800 border-b-2 pb-1 mb-2 uppercase text-sm">Advance Notes & Details</h4>
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  {(advances[viewingSlipLabour.id] || []).map(tx => (
                    <tr key={tx.id} className="border-b">
                      <td className="py-2 text-gray-750">{tx.date}</td>
                      <td className="py-2 text-gray-750">{tx.notes}</td>
                      <td className="py-2 text-right font-bold text-gray-900">₹{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payments Details */}
          {(payments[viewingSlipLabour.id] || []).length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-green-800 border-b-2 pb-1 mb-2 uppercase text-sm">Salary Payment History</h4>
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  {(payments[viewingSlipLabour.id] || []).map(tx => (
                    <tr key={tx.id} className="border-b">
                      <td className="py-2 text-gray-750">{tx.date}</td>
                      <td className="py-2 text-gray-750">{tx.notes}</td>
                      <td className="py-2 text-right font-bold text-gray-900">₹{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signature Blocks */}
          <div className="mt-16 grid grid-cols-2 gap-12 text-center text-sm">
            <div className="border-t-2 border-gray-400 pt-3">
              <p className="text-gray-600 font-bold">Employee Signature</p>
            </div>
            <div className="border-t-2 border-gray-400 pt-3">
              <p className="text-gray-600 font-bold">Authorized Signature</p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-xxs text-gray-400 font-semibold italic border-t pt-4">
            System generated slip. Generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

    </div>
  );
}
