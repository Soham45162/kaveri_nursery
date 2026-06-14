import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserPlus, Printer } from 'lucide-react';

export default function LabourRegister() {
  const [labours, setLabours] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [form, setForm] = useState({ name: '', role: '', phone: '' });

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
  };

  const addLabour = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    const docRef = await addDoc(collection(db, 'labours'), { ...form, joinedAt: new Date().toISOString() });
    setLabours([...labours, { id: docRef.id, ...form }]);
    setForm({ name: '', role: '', phone: '' });
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
    <div className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60 print-container">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center no-print">
        <h2 className="text-2xl font-extrabold flex items-center gap-2"><UserPlus /> Labour Register</h2>
        <div className="flex items-center gap-4">
          <input 
            type="month" 
            value={monthKey} 
            onChange={(e) => {
              if(e.target.value) setCurrentDate(new Date(e.target.value + '-01T00:00:00'));
            }} 
            className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2" 
          />
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2"><Printer size={18}/> Print PDF</button>
        </div>
      </div>

      <form onSubmit={addLabour} className="mb-8 grid gap-4 md:grid-cols-4 no-print">
        <input placeholder="Labour Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none" required />
        <input placeholder="Role (e.g. Gardener)" value={form.role} onChange={e=>setForm({...form, role: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none" />
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-2 outline-none" />
        <button type="submit" className="btn-primary">Add Labourer</button>
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
                  <td className="p-3 font-bold border border-leaf-700/20">
                    {labour.name} <span className="block text-xs font-normal text-gray-500">{labour.role}</span>
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
  );
}
