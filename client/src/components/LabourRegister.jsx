import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserPlus, Trash2, Edit, DollarSign, History, X, Check, Printer } from 'lucide-react';

export default function LabourRegister() {
  const [labours, setLabours] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [payments, setPayments] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [form, setForm] = useState({ name: '', role: '', phone: '', salaryType: 'daily', salaryRate: '' });
  const [editingLabour, setEditingLabour] = useState(null);
  const [payingLabourId, setPayingLabourId] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', notes: '' });
  const [viewingHistoryLabourId, setViewingHistoryLabourId] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    fetchData();
  }, [monthKey]);

  const fetchData = async () => {
    const labSnap = await getDocs(collection(db, 'labours'));
    setLabours(labSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const attSnap = await getDoc(doc(db, 'attendance', monthKey));
    if (attSnap.exists()) {
      setAttendance(attSnap.data());
    } else {
      setAttendance({});
    }

    const paySnap = await getDoc(doc(db, 'payments', monthKey));
    if (paySnap.exists()) {
      setPayments(paySnap.data());
    } else {
      setPayments({});
    }
  };

  const addLabour = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    const labourData = {
      name: form.name,
      role: form.role,
      phone: form.phone,
      salaryType: form.salaryType || 'daily',
      salaryRate: form.salaryRate ? Number(form.salaryRate) : 0,
      joinedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'labours'), labourData);
    setLabours([...labours, { id: docRef.id, ...labourData }]);
    setForm({ name: '', role: '', phone: '', salaryType: 'daily', salaryRate: '' });
  };

  const updateLabour = async (e) => {
    e.preventDefault();
    if (!editingLabour || !editingLabour.name) return;
    try {
      const docRef = doc(db, 'labours', editingLabour.id);
      const updatedData = {
        name: editingLabour.name,
        role: editingLabour.role,
        phone: editingLabour.phone,
        salaryType: editingLabour.salaryType || 'daily',
        salaryRate: Number(editingLabour.salaryRate || 0)
      };
      await setDoc(docRef, updatedData, { merge: true });
      setLabours(labours.map(l => l.id === editingLabour.id ? { ...l, ...updatedData } : l));
      setEditingLabour(null);
    } catch (err) {
      console.error("Error updating labourer:", err);
    }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    if (!payingLabourId || !payForm.amount) return;
    
    const amountNum = Number(payForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
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
    setPayForm({ amount: '', notes: '' });
    
    try {
      const docRef = doc(db, 'payments', monthKey);
      await setDoc(docRef, newPayments);
    } catch (err) {
      console.error("Error recording payment:", err);
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
      console.error("Error deleting payment:", err);
    }
  };

  const removeLabour = async (id) => {
    if (!window.confirm("Are you sure you want to remove this labourer?")) return;
    try {
      await deleteDoc(doc(db, 'labours', id));
      setLabours(labours.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (labourId, day) => {
    const currentStatus = attendance[labourId]?.[day];
    let nextStatus;
    
    if (!currentStatus) nextStatus = 'Full';
    else if (currentStatus === 'Full') nextStatus = 'Half';
    else if (currentStatus === 'Half') nextStatus = 'Absent';
    else nextStatus = null;

    const newAttendance = { ...attendance };
    if (!newAttendance[labourId]) newAttendance[labourId] = {};
    
    if (nextStatus) {
      newAttendance[labourId][day] = nextStatus;
    } else {
      delete newAttendance[labourId][day];
    }
    
    setAttendance(newAttendance);

    const docRef = doc(db, 'attendance', monthKey);
    await setDoc(docRef, newAttendance, { merge: true });
  };

  const calculateTotals = (labourId) => {
    const record = attendance[labourId] || {};
    let full = 0, half = 0, absent = 0;
    Object.values(record).forEach(val => {
      if (val === 'Full') full++;
      if (val === 'Half') half++;
      if (val === 'Absent') absent++;
    });
    return { full, half, absent };
  };

  const getStatusColor = (status) => {
    if (status === 'Full') return 'bg-green-500 text-white';
    if (status === 'Half') return 'bg-yellow-400 text-yellow-900';
    if (status === 'Absent') return 'bg-red-500 text-white';
    return 'bg-gray-100 hover:bg-gray-200 dark:bg-[#0c2411]';
  };

  const getStatusIcon = (status) => {
    if (status === 'Full') return 'F';
    if (status === 'Half') return 'H';
    if (status === 'Absent') return 'A';
    return '';
  };

  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
      <div className="attendance-section-wrap">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <UserPlus /> Labour Register
            <button 
              type="button" 
              onClick={() => {
                document.body.classList.add('printing-labour');
                window.print();
                document.body.classList.remove('printing-labour');
              }}
              className="no-print ml-4 inline-flex items-center gap-1.5 bg-leaf-100 hover:bg-leaf-200 text-leaf-900 px-3 py-1 rounded-full text-xs font-semibold transition dark:bg-leaf-800 dark:hover:bg-leaf-700 dark:text-leaf-100"
            >
              <Printer size={13} /> Print
            </button>
          </h2>
        <input 
          type="month" 
          value={monthKey} 
          onChange={(e) => {
            if(e.target.value) setCurrentDate(new Date(e.target.value + '-01T00:00:00'));
          }} 
          className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2" 
        />
      </div>

      <form onSubmit={addLabour} className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-6 no-print">
        <input placeholder="Labour Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none" required />
        <input placeholder="Role (e.g. Gardener)" value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none" />
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none" />
        <select value={form.salaryType} onChange={e=>setForm({...form, salaryType: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none dark:bg-leaf-900">
          <option value="daily">Daily Wage</option>
          <option value="monthly">Monthly Salary</option>
        </select>
        <input type="number" placeholder="Rate (₹)" value={form.salaryRate} onChange={e=>setForm({...form, salaryRate: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none" required />
        <button type="submit" className="btn-primary w-full">Add Labourer</button>
      </form>

      <div className="print-header hidden mb-6 text-center text-black">
        <h1 className="text-3xl font-bold">Kaveri Nursery - Labour Attendance Register</h1>
        <p className="text-xl mt-2 font-semibold">Month: {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="overflow-x-auto print-table-wrapper">
        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
          <thead>
            <tr className="border-b border-leaf-700/20 font-bold uppercase text-soil dark:text-leaf-300">
              <th className="p-3 min-w-[150px] border border-leaf-700/20">Name</th>
              {daysArray.map(day => (
                <th key={day} className="p-3 text-center border border-leaf-700/20 w-8">{day}</th>
              ))}
              <th className="p-3 text-center border border-leaf-700/20">F</th>
              <th className="p-3 text-center border border-leaf-700/20">H</th>
              <th className="p-3 text-center border border-leaf-700/20">A</th>
            </tr>
          </thead>
          <tbody>
            {labours.length === 0 ? (
              <tr><td colSpan={daysInMonth + 4} className="p-4 text-center border border-leaf-700/20">No labours registered.</td></tr>
            ) : labours.map(labour => {
              const totals = calculateTotals(labour.id);
              return (
                <tr key={labour.id} className="border-b border-leaf-700/10">
                  <td className="p-3 font-bold border border-leaf-700/20 group">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        {labour.name} <span className="block text-xs font-normal text-gray-500">{labour.role}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setEditingLabour(labour)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-leaf-700 hover:bg-leaf-50 rounded transition-all no-print dark:hover:bg-leaf-800"
                          title="Edit Labourer"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => removeLabour(labour.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all no-print dark:hover:bg-red-900/20"
                          title="Remove Labourer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </td>
                  {daysArray.map(day => {
                    const status = attendance[labour.id]?.[day];
                    return (
                      <td key={day} className="border border-leaf-700/20 p-1 text-center">
                        <button 
                          onClick={() => toggleStatus(labour.id, day)}
                          className={`h-7 w-7 rounded font-bold text-xs ${getStatusColor(status)} transition-colors duration-200 no-print-bg`}
                        >
                          {getStatusIcon(status)}
                        </button>
                      </td>
                    )
                  })}
                  <td className="p-3 text-center border border-leaf-700/20 font-bold text-green-600">{totals.full}</td>
                  <td className="p-3 text-center border border-leaf-700/20 font-bold text-yellow-600">{totals.half}</td>
                  <td className="p-3 text-center border border-leaf-700/20 font-bold text-red-600">{totals.absent}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold no-print justify-center">
        <span className="flex items-center gap-2"><div className="w-5 h-5 bg-green-500 rounded"></div> Full Day (F)</span>
        <span className="flex items-center gap-2"><div className="w-5 h-5 bg-yellow-400 rounded"></div> Half Day (H)</span>
        <span className="flex items-center gap-2"><div className="w-5 h-5 bg-red-500 rounded"></div> Absent (A)</span>
        <span className="flex items-center gap-2 ml-4 text-gray-500 italic">Click a cell to toggle status</span>
      </div>
      </div>

      {/* Monthly Payroll & Payments Ledger */}
      <div className="mt-10 pt-8 border-t border-leaf-700/20 payroll-section-wrap">
        <div className="mb-6 no-print">
          <h3 className="text-2xl font-extrabold flex items-center gap-2">
            <DollarSign /> Monthly Payroll & Payments Ledger
            <button 
              type="button" 
              onClick={() => {
                document.body.classList.add('printing-payroll');
                window.print();
                document.body.classList.remove('printing-payroll');
              }}
              className="no-print ml-4 inline-flex items-center gap-1.5 bg-leaf-100 hover:bg-leaf-200 text-leaf-900 px-3 py-1 rounded-full text-xs font-semibold transition dark:bg-leaf-800 dark:hover:bg-leaf-700 dark:text-leaf-100"
            >
              <Printer size={13} /> Print
            </button>
          </h3>
          <p className="text-sm text-gray-500 mt-1">Calculated salaries, deductions, and recorded payments for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
        </div>

        {/* Print-only Header for Ledger */}
        <div className="print-header hidden mb-6 text-center text-black">
          <h2 className="text-2xl font-bold">Kaveri Nursery - Monthly Payroll & Payments Ledger</h2>
          <p className="text-lg mt-1 font-semibold">Month: {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="overflow-x-auto print-table-wrapper">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="border-b border-leaf-700/20 font-bold uppercase text-soil dark:text-leaf-300">
                <th className="p-3 border border-leaf-700/20">Name</th>
                <th className="p-3 border border-leaf-700/20">Salary Config</th>
                <th className="p-3 border border-leaf-700/20 text-center">Worked Days (F + 0.5*H)</th>
                <th className="p-3 border border-leaf-700/20 text-right">Gross Salary</th>
                <th className="p-3 border border-leaf-700/20 text-right text-red-500">Salary Cut</th>
                <th className="p-3 border border-leaf-700/20 text-right text-green-600">Net Salary</th>
                <th className="p-3 border border-leaf-700/20 text-right">Amount Paid</th>
                <th className="p-3 border border-leaf-700/20 text-right">Balance Due</th>
                <th className="p-3 border border-leaf-700/20 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labours.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center border border-leaf-700/20">No payroll data available.</td>
                </tr>
              ) : labours.map(labour => {
                const totals = calculateTotals(labour.id);
                const workedDays = totals.full + 0.5 * totals.half;
                
                const salaryType = labour.salaryType || 'daily';
                const salaryRate = labour.salaryRate || 0;
                
                let grossSalary = 0;
                let salaryCut = 0;
                let netSalary = 0;
                
                if (salaryType === 'monthly') {
                  grossSalary = salaryRate;
                  netSalary = Math.round((salaryRate / daysInMonth) * workedDays);
                  salaryCut = grossSalary - netSalary;
                } else {
                  // Daily
                  grossSalary = Math.round(salaryRate * daysInMonth);
                  netSalary = Math.round(salaryRate * workedDays);
                  salaryCut = grossSalary - netSalary;
                }
                
                const labourPayments = payments[labour.id] || [];
                const totalPaid = labourPayments.reduce((sum, tx) => sum + tx.amount, 0);
                const balanceDue = netSalary - totalPaid;
                
                return (
                  <tr key={labour.id} className="border-b border-leaf-700/10">
                    <td className="p-3 font-bold border border-leaf-700/20">
                      {labour.name}
                      <span className="block text-xs font-normal text-gray-500">{labour.role || 'No Role'}</span>
                    </td>
                    <td className="p-3 border border-leaf-700/20">
                      {salaryType === 'monthly' ? (
                        <span>₹{salaryRate.toLocaleString()} <span className="text-xs text-gray-500">/ Month</span></span>
                      ) : (
                        <span>₹{salaryRate.toLocaleString()} <span className="text-xs text-gray-500">/ Day</span></span>
                      )}
                    </td>
                    <td className="p-3 border border-leaf-700/20 text-center font-bold">
                      {workedDays} <span className="text-xs font-normal text-gray-500">/ {daysInMonth} days</span>
                    </td>
                    <td className="p-3 border border-leaf-700/20 text-right">
                      ₹{grossSalary.toLocaleString()}
                    </td>
                    <td className="p-3 border border-leaf-700/20 text-right text-red-650 dark:text-red-400 font-semibold">
                      -₹{salaryCut.toLocaleString()}
                    </td>
                    <td className="p-3 border border-leaf-700/20 text-right text-green-600 dark:text-green-400 font-extrabold">
                      ₹{netSalary.toLocaleString()}
                    </td>
                    <td className="p-3 border border-leaf-700/20 text-right font-semibold text-leaf-800 dark:text-leaf-200">
                      ₹{totalPaid.toLocaleString()}
                    </td>
                    <td className="p-3 border border-leaf-700/20 text-right font-extrabold">
                      <span className={balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : balanceDue < 0 ? 'text-red-500' : 'text-gray-500'}>
                        ₹{balanceDue.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 border border-leaf-700/20 text-center no-print">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => {
                            setPayingLabourId(labour.id);
                            setPayForm({ amount: '', notes: '' });
                          }}
                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                        >
                          <DollarSign size={12} /> Pay
                        </button>
                        <button 
                          onClick={() => setViewingHistoryLabourId(labour.id)}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-leaf-800 dark:hover:bg-leaf-700 text-gray-800 dark:text-gray-200 font-bold py-1 px-3 rounded-lg text-xs transition-colors"
                        >
                          <History size={12} /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Labourer Modal */}
      {editingLabour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl dark:bg-leaf-900 border border-leaf-700/10 text-left">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2"><Edit size={20} /> Edit Labourer</h3>
              <button onClick={() => setEditingLabour(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={updateLabour} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500">Name</label>
                <input value={editingLabour.name} onChange={e=>setEditingLabour({...editingLabour, name: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none w-full" required />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500">Role</label>
                <input value={editingLabour.role || ''} onChange={e=>setEditingLabour({...editingLabour, role: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none w-full" />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500">Phone</label>
                <input value={editingLabour.phone || ''} onChange={e=>setEditingLabour({...editingLabour, phone: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-gray-500">Salary Type</label>
                  <select value={editingLabour.salaryType || 'daily'} onChange={e=>setEditingLabour({...editingLabour, salaryType: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none w-full dark:bg-leaf-900">
                    <option value="daily">Daily Wage</option>
                    <option value="monthly">Monthly Salary</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-bold text-gray-500">Rate (₹)</label>
                  <input type="number" value={editingLabour.salaryRate || ''} onChange={e=>setEditingLabour({...editingLabour, salaryRate: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none w-full" required />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingLabour(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingLabourId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl dark:bg-leaf-900 border border-leaf-700/10 text-left">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2"><DollarSign size={20} /> Record Payment</h3>
              <button onClick={() => setPayingLabourId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Record a payment for <strong>{labours.find(l => l.id === payingLabourId)?.name}</strong> for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
            <form onSubmit={recordPayment} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500">Amount (₹)</label>
                <input type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm, amount: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none w-full" placeholder="Enter amount paid" required />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500">Notes / Remarks</label>
                <input value={payForm.notes} onChange={e=>setPayForm({...payForm, notes: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none w-full" placeholder="e.g. Advance, Final Payment" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setPayingLabourId(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {viewingHistoryLabourId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl dark:bg-leaf-900 border border-leaf-700/10 text-left">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-extrabold flex items-center gap-2"><History size={20} /> Payment History</h3>
              <button onClick={() => setViewingHistoryLabourId(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-leaf-800 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Payments history for <strong>{labours.find(l => l.id === viewingHistoryLabourId)?.name}</strong> in {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {!payments[viewingHistoryLabourId] || payments[viewingHistoryLabourId].length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No payments recorded for this month.</p>
              ) : (
                payments[viewingHistoryLabourId].map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center bg-leaf-50 dark:bg-leaf-800/30 p-3 rounded-xl border border-leaf-700/5">
                    <div>
                      <p className="font-extrabold text-leaf-800 dark:text-leaf-200">₹{tx.amount}</p>
                      <p className="text-xs text-gray-500">{tx.date} · {tx.notes}</p>
                    </div>
                    <button 
                      onClick={() => deletePayment(viewingHistoryLabourId, tx.id)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Delete Payment Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setViewingHistoryLabourId(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
