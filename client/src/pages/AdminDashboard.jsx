import { 
  BarChart3, Bell, BriefcaseBusiness, Check, Edit, FileText, Image, Leaf, 
  LogOut, Package, Plus, Printer, Search, ShoppingBag, Star, Trash2, Users,
  Coins, DollarSign, TrendingUp, Calendar, AlertTriangle
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext.jsx';
import { db, storage } from '../config/firebase.js';
import LabourRegister from '../components/LabourRegister.jsx';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#2d6f2c', '#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6'];

const emptyBillLine = { plantName: '', qty: 1, rate: 0 };
const emptyBillForm = {
  type: 'Quotation',
  customerName: '',
  customerPhone: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  lines: [emptyBillLine]
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const emptyProjectForm = {
  title: '',
  category: 'Garden Design',
  location: '',
  duration: '',
  scope: '',
  plantsUsed: [],
  result: '',
  before: '',
  after: '',
  beforeFile: null,
  afterFile: null,
  additionalImages: [],
  additionalImageFiles: []
};

export default function AdminDashboard() {
  const { logout, token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'plants', 'billing', 'projects', 'reviews', 'labour'
  const [inventory, setInventory] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [managedProjects, setManagedProjects] = useState([]);
  const [form, setForm] = useState({ name: '', scientificName: '', price: '', stock: '', category: 'Indoor', description: '', imageFile: null });
  const [billForm, setBillForm] = useState(emptyBillForm);
  const [bills, setBills] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [laboursCount, setLaboursCount] = useState(0);
  const [labours, setLabours] = useState([]);
  const [plantFilterQuery, setPlantFilterQuery] = useState('');
  
  // Labour Ledger Data States
  const [attendance, setAttendance] = useState({});
  const [payments, setPayments] = useState({});
  const [advances, setAdvances] = useState({});
  const [currentAnalyticsDate, setCurrentAnalyticsDate] = useState(new Date());
  const [refetchIndex, setRefetchIndex] = useState(0);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'overview') {
      setRefetchIndex(prev => prev + 1);
    }
  };
  const [plantSearchQuery, setPlantSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [previewBill, setPreviewBill] = useState(null);
  const [letterheadType, setLetterheadType] = useState(() => localStorage.getItem('letterheadType') || 'digital');
  const [customLetterheadUrl, setCustomLetterheadUrl] = useState(() => localStorage.getItem('customLetterheadUrl') || '');
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);

  const addPlant = async (event) => {
    event.preventDefault();
    if (!form.name || !form.price || !form.stock) return;

    let imageUrl = 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80';
    if (form.imageFile) {
       const imageRef = ref(storage, `plants/${Date.now()}`);
       await uploadBytes(imageRef, form.imageFile);
       imageUrl = await getDownloadURL(imageRef);
    }

    const plantData = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      discount: 0,
      image: imageUrl,
      scientificName: form.scientificName || 'Add scientific name',
      water: 'Moderate', sunlight: 'Indirect light', soil: 'Well-drained soil', temperature: '18-32°C',
      growthTips: 'Update growth tips from plant management.', fertilizer: 'Update fertilizer tips.',
      benefits: 'Update plant benefits.', diseases: 'Update disease info.', seasonalCare: 'Update seasonal care.'
    };
    delete plantData.imageFile;

    try {
      const docRef = await addDoc(collection(db, 'plants'), plantData);
      setInventory([{ _id: docRef.id, ...plantData }, ...inventory]);
      setForm({ name: '', scientificName: '', price: '', stock: '', category: 'Indoor', description: '', imageFile: null });
    } catch (e) {
      console.error("Error adding plant", e);
    }
  };

  const removePlant = async (id) => {
    try {
      await deleteDoc(doc(db, 'plants', id));
      setInventory(current => current.filter(p => p._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const projSnap = await getDocs(collection(db, 'gallery'));
        if (!projSnap.empty) setManagedProjects(projSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })).map(apiProjectToUi));

        const plantSnap = await getDocs(collection(db, 'plants'));
        if (!plantSnap.empty) setInventory(plantSnap.docs.map(docSnap => ({ _id: docSnap.id, ...docSnap.data() })));

        const revSnap = await getDocs(collection(db, 'reviews'));
        if (!revSnap.empty) setAdminReviews(revSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
        
        const billSnap = await getDocs(collection(db, 'bills'));
        if (!billSnap.empty) setBills(billSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));

        const visitorSnap = await getDoc(doc(db, 'stats', 'visitors'));
        if (visitorSnap.exists()) {
          setVisitorsCount(visitorSnap.data().count || 0);
        }

        const labSnap = await getDocs(collection(db, 'labours'));
        const laboursData = labSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setLabours(laboursData);
        setLaboursCount(laboursData.length);

        const year = currentAnalyticsDate.getFullYear();
        const month = currentAnalyticsDate.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

        try {
          const attSnap = await getDoc(doc(db, 'attendance', monthKey));
          if (attSnap.exists()) setAttendance(attSnap.data());
          else setAttendance({});
        } catch (e) { console.error("Error fetching attendance:", e); }

        try {
          const paySnap = await getDoc(doc(db, 'payments', monthKey));
          if (paySnap.exists()) setPayments(paySnap.data());
          else setPayments({});
        } catch (e) { console.error("Error fetching payments:", e); }

        try {
          const advSnap = await getDoc(doc(db, 'advances', monthKey));
          if (advSnap.exists()) setAdvances(advSnap.data());
          else setAdvances({});
        } catch (e) { console.error("Error fetching advances:", e); }

        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'billing'));
          if (settingsSnap.exists()) {
            const sData = settingsSnap.data();
            if (sData.letterheadType) {
              setLetterheadType(sData.letterheadType);
              localStorage.setItem('letterheadType', sData.letterheadType);
            }
            if (sData.customLetterheadUrl) {
              setCustomLetterheadUrl(sData.customLetterheadUrl);
              localStorage.setItem('customLetterheadUrl', sData.customLetterheadUrl);
            }
          }
        } catch (err) {
          console.warn("Failed to fetch settings from Firestore, using local fallback", err);
        }
      } catch (error) {
        console.error("Error loading admin data", error);
      }
    }
    loadData();
  }, [currentAnalyticsDate, refetchIndex]);

  const todaySalesStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const todayVal = bills
      .filter(b => b.date === todayStr)
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

    const yesterdayVal = bills
      .filter(b => b.date === yesterdayStr)
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

    const diff = todayVal - yesterdayVal;
    const pct = yesterdayVal > 0 ? (diff / yesterdayVal) * 100 : todayVal > 0 ? 100 : 0;

    return {
      total: todayVal,
      yesterday: yesterdayVal,
      pct: pct.toFixed(1),
      trend: diff >= 0 ? 'up' : 'down'
    };
  }, [bills]);

  const monthlyRevenueStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentVal = bills
      .filter(b => {
        if (!b.date) return false;
        const bDate = new Date(b.date);
        return b.type === 'Bill' && bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
      })
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

    const lastMonthVal = bills
      .filter(b => {
        if (!b.date) return false;
        const bDate = new Date(b.date);
        return b.type === 'Bill' && bDate.getMonth() === lastMonth && bDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

    const diff = currentVal - lastMonthVal;
    const pct = lastMonthVal > 0 ? (diff / lastMonthVal) * 100 : currentVal > 0 ? 100 : 0;

    return {
      total: currentVal,
      lastMonth: lastMonthVal,
      pct: pct.toFixed(1),
      trend: diff >= 0 ? 'up' : 'down'
    };
  }, [bills]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(p => Number(p.stock) <= 10).length;
  }, [inventory]);

  const pendingReviewsCount = useMemo(() => {
    return adminReviews.filter(r => !r.approved).length;
  }, [adminReviews]);

  const inventoryBreakdown = useMemo(() => {
    const categories = ['Indoor', 'Outdoor', 'Flowering', 'Medicinal', 'Fruit', 'Farm'];
    const breakdown = {};
    categories.forEach(cat => {
      const matched = inventory.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
      breakdown[cat] = {
        count: matched.length,
        stock: matched.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
      };
    });
    return breakdown;
  }, [inventory]);

  const payrollStats = useMemo(() => {
    const year = currentAnalyticsDate.getFullYear();
    const month = currentAnalyticsDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let totalSalaryPaid = 0;
    let totalAdvancesGiven = 0;
    let totalOutstandingBalance = 0;

    labours.forEach(labour => {
      const attRecord = attendance[labour.id] || {};
      let full = 0, half = 0;
      Object.values(attRecord).forEach(val => {
        if (val === 'Full') full++;
        if (val === 'Half') half++;
      });
      const workedDays = full + 0.5 * half;

      const salaryType = labour.salaryType || 'daily';
      const salaryRate = Number(labour.salaryRate) || 0;
      let netSalary = 0;
      if (salaryType === 'monthly') {
        netSalary = Math.round((salaryRate / daysInMonth) * workedDays);
      } else {
        netSalary = Math.round(salaryRate * workedDays);
      }

      const labourAdvances = advances[labour.id] || [];
      const totalAdvance = labourAdvances.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const netPayable = netSalary - totalAdvance;

      const labourPayments = payments[labour.id] || [];
      const totalPaid = labourPayments.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const balanceDue = netPayable - totalPaid;

      totalSalaryPaid += totalPaid;
      totalAdvancesGiven += totalAdvance;
      totalOutstandingBalance += balanceDue;
    });

    return {
      paid: totalSalaryPaid,
      advances: totalAdvancesGiven,
      outstanding: totalOutstandingBalance
    };
  }, [labours, attendance, advances, payments, currentAnalyticsDate]);

  const last30DaysSalesData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const dailySum = bills
        .filter(b => b.date === dateStr)
        .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sales: dailySum,
        dateRaw: dateStr
      });
    }
    return data;
  }, [bills]);

  const cumulativeRevenueData = useMemo(() => {
    let currentSum = 0;
    return last30DaysSalesData.map(item => {
      currentSum += item.sales;
      return {
        date: item.date,
        revenue: currentSum
      };
    });
  }, [last30DaysSalesData]);

  const monthlyGrowthData = useMemo(() => {
    const monthsData = {};
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsData[mKey] = {
        monthName: d.toLocaleString('default', { month: 'short' }),
        sales: 0
      };
    }
    
    bills.forEach(b => {
      if (!b.date) return;
      const bDate = new Date(b.date);
      const mKey = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[mKey]) {
        monthsData[mKey].sales += (Number(b.total) || 0);
      }
    });
    
    return Object.values(monthsData);
  }, [bills]);

  const categoryPieData = useMemo(() => {
    const counts = {};
    inventory.forEach(p => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(cat => ({
      name: cat,
      value: counts[cat]
    }));
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(plant => 
      plant.name.toLowerCase().includes(plantFilterQuery.toLowerCase()) ||
      (plant.scientificName || '').toLowerCase().includes(plantFilterQuery.toLowerCase()) ||
      plant.category.toLowerCase().includes(plantFilterQuery.toLowerCase())
    );
  }, [inventory, plantFilterQuery]);

  const approveReview = async (id) => {
    try {
      await updateDoc(doc(db, 'reviews', id), { approved: true });
      setAdminReviews(current => current.map(r => r.id === id ? { ...r, approved: true } : r));
    } catch (e) { console.error(e); }
  };

  const deleteReview = async (id) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setAdminReviews(current => current.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  };

  const addOrUpdateProject = async (event) => {
    event.preventDefault();
    
    if (!projectForm.title.trim()) {
      alert("Please enter a project title.");
      return;
    }
    if (!projectForm.scope.trim()) {
      alert("Please enter work details / scope.");
      return;
    }

    setIsSavingProject(true);

    let beforeUrl = projectForm.before || 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=900&q=80';
    let afterUrl = projectForm.after || 'https://images.unsplash.com/photo-1558904541-efa8c3a30fc9?auto=format&fit=crop&w=900&q=80';

    try {
      if (projectForm.beforeFile) {
        const beforeRef = ref(storage, `gallery/before-${Date.now()}`);
        await uploadBytes(beforeRef, projectForm.beforeFile);
        beforeUrl = await getDownloadURL(beforeRef);
      }
      if (projectForm.afterFile) {
        const afterRef = ref(storage, `gallery/after-${Date.now()}`);
        await uploadBytes(afterRef, projectForm.afterFile);
        afterUrl = await getDownloadURL(afterRef);
      }

      const uploadedAdditionalUrls = [];
      if (projectForm.additionalImageFiles && projectForm.additionalImageFiles.length > 0) {
        for (let i = 0; i < projectForm.additionalImageFiles.length; i++) {
          const file = projectForm.additionalImageFiles[i];
          const imgRef = ref(storage, `gallery/additional-${Date.now()}-${i}`);
          await uploadBytes(imgRef, file);
          const url = await getDownloadURL(imgRef);
          uploadedAdditionalUrls.push(url);
        }
      }

      const projectData = {
        title: projectForm.title,
        category: projectForm.category,
        location: projectForm.location,
        duration: projectForm.duration,
        scope: projectForm.scope,
        plantsUsed: projectForm.plantsUsed || [],
        result: projectForm.result || 'Successfully completed landscaping project.',
        beforeImage: beforeUrl,
        afterImage: afterUrl,
        description: projectForm.result || 'Successfully completed landscaping project.',
        additionalImages: [...(projectForm.additionalImages || []), ...uploadedAdditionalUrls]
      };

      let savedId = editingProjectId;
      if (editingProjectId) {
        await updateDoc(doc(db, 'gallery', editingProjectId), projectData);
      } else {
        const docRef = await addDoc(collection(db, 'gallery'), projectData);
        savedId = docRef.id;
      }
      
      const savedProject = apiProjectToUi({ _id: savedId, ...projectData });
      setManagedProjects((current) => {
        if (editingProjectId) {
          return current.map((project) => (project.id === editingProjectId ? savedProject : project));
        }
        return [savedProject, ...current];
      });

      alert(editingProjectId ? "Project updated successfully!" : "Project added successfully!");

      setEditingProjectId(null);
      setProjectForm(emptyProjectForm);
    } catch (error) {
      console.error("Error saving project", error);
      alert("Error saving project: " + error.message);
    } finally {
      setIsSavingProject(false);
    }
  };

  const editProject = (project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      category: project.category,
      location: project.location,
      duration: project.duration,
      scope: project.scope,
      plantsUsed: project.plantsUsed || [],
      result: project.result,
      before: project.before,
      after: project.after,
      beforeFile: null,
      afterFile: null,
      additionalImages: project.additionalImages || [],
      additionalImageFiles: []
    });
  };

  const removeProject = async (id) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      // Local fallback keeps the UI responsive in demo mode.
    }
    setManagedProjects((current) => current.filter((project) => project.id !== id));
    if (editingProjectId === id) {
      setEditingProjectId(null);
      setProjectForm(emptyProjectForm);
    }
  };

  const handleProjectImage = (field, file) => {
    if (!file) return;
    setProjectForm((current) => ({ ...current, [field]: URL.createObjectURL(file), [`${field}File`]: file }));
  };

  const handleRemovePlantTag = (plantName) => {
    setProjectForm((current) => ({
      ...current,
      plantsUsed: current.plantsUsed.filter((p) => p !== plantName)
    }));
  };

  const handleAddPlantTag = (plantName) => {
    if (!plantName || !plantName.trim()) return;
    const trimmed = plantName.trim();
    setProjectForm((current) => {
      if (current.plantsUsed.includes(trimmed)) return current;
      return {
        ...current,
        plantsUsed: [...current.plantsUsed, trimmed]
      };
    });
    setPlantSearchQuery('');
    setShowSuggestions(false);
  };

  const handleAdditionalPhotosUpload = (files) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setProjectForm((current) => ({
      ...current,
      additionalImageFiles: [...(current.additionalImageFiles || []), ...newFiles]
    }));
  };

  const removeAdditionalImage = (type, index) => {
    setProjectForm((current) => {
      if (type === 'url') {
        return {
          ...current,
          additionalImages: current.additionalImages.filter((_, idx) => idx !== index)
        };
      } else {
        return {
          ...current,
          additionalImageFiles: current.additionalImageFiles.filter((_, idx) => idx !== index)
        };
      }
    });
  };

  const billTotal = billForm.lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.rate || 0), 0);

  const updateBillLine = (index, field, value) => {
    setBillForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        const updated = { ...line, [field]: value };
        const selectedPlant = field === 'plantName' ? inventory.find((plant) => plant.name === value) : null;
        return selectedPlant ? { ...updated, rate: selectedPlant.price } : updated;
      })
    }));
  };

  const addBillLine = () => {
    setBillForm((current) => ({ ...current, lines: [...current.lines, { ...emptyBillLine }] }));
  };

  const removeBillLine = (index) => {
    setBillForm((current) => ({
      ...current,
      lines: current.lines.length === 1 ? current.lines : current.lines.filter((_, lineIndex) => lineIndex !== index)
    }));
  };

  const saveBill = async (event) => {
    event.preventDefault();
    if (!billForm.customerName || billForm.lines.some((line) => !line.plantName)) return;
    const billData = {
      ...billForm,
      number: `${billForm.type === 'Bill' ? 'BILL' : 'QT'}-${String(bills.length + 1).padStart(4, '0')}`,
      total: billTotal,
      createdAt: new Date().toLocaleString()
    };
    try {
      const docRef = await addDoc(collection(db, 'bills'), billData);
      const savedBill = { id: docRef.id, ...billData };
      setBills((current) => [savedBill, ...current]);
      setBillForm(emptyBillForm);
      setPreviewBill(savedBill);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteBill = async (id) => {
    try {
      await deleteDoc(doc(db, 'bills', id));
      setBills(current => current.filter(b => b.id !== id));
    } catch (e) { console.error(e); }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySales = bills.reduce((total, bill) => {
    const billDate = new Date(bill.date);
    if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
      const billTotal = bill.lines.reduce((sum, line) => sum + (Number(line.qty) * Number(line.rate)), 0);
      return total + billTotal;
    }
    return total;
  }, 0);

  const saveLetterheadSettings = async (type, url = customLetterheadUrl) => {
    setLetterheadType(type);
    localStorage.setItem('letterheadType', type);
    try {
      await setDoc(doc(db, 'settings', 'billing'), {
        letterheadType: type,
        customLetterheadUrl: url
      }, { merge: true });
    } catch (e) {
      console.error("Error saving settings to Firestore", e);
    }
  };

  const handleLetterheadUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingLetterhead(true);
    try {
      const storageRef = ref(storage, `settings/letterhead-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setCustomLetterheadUrl(downloadUrl);
      localStorage.setItem('customLetterheadUrl', downloadUrl);
      await saveLetterheadSettings(letterheadType, downloadUrl);
    } catch (error) {
      console.error("Error uploading letterhead image", error);
    } finally {
      setUploadingLetterhead(false);
    }
  };

  return (
    <main className="pt-24">
      <section className="section-pad bg-leaf-50 dark:bg-[#0c2411]">
        <div className="container-page">
          <div className="mb-6 lg:mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs lg:text-sm font-extrabold uppercase tracking-[0.25em] text-soil dark:text-leaf-300">Secure Dashboard</p>
              <h1 className="font-display text-3xl md:text-5xl font-extrabold">Welcome, {user?.name || 'Owner'}</h1>
            </div>
            <button onClick={logout} className="btn-secondary"><LogOut size={18} /> Logout</button>
          </div>
          {/* Main Tabbed Grid Layout */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mt-6">
            
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-64 shrink-0 no-print">
              <div className="glass rounded-[1.5rem] lg:rounded-[2rem] p-2.5 lg:p-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 lg:gap-1.5 sticky top-20 lg:top-28 scrollbar-none">
                <p className="hidden lg:block text-[10px] font-extrabold uppercase tracking-widest text-soil dark:text-leaf-300 px-4 py-2.5 border-b border-leaf-700/5 mb-2">Management Tabs</p>
                <TabButton id="overview" icon={BarChart3} label="Overview & Stats" activeTab={activeTab} onClick={handleTabChange} />
                <TabButton id="plants" icon={Leaf} label="Plant Inventory" activeTab={activeTab} onClick={handleTabChange} />
                <TabButton id="billing" icon={FileText} label="Billing System" activeTab={activeTab} onClick={handleTabChange} />
                <TabButton id="projects" icon={BriefcaseBusiness} label="Past Work Projects" activeTab={activeTab} onClick={handleTabChange} />
                <TabButton id="labour" icon={Users} label="Labour ERP" activeTab={activeTab} onClick={handleTabChange} />
                <TabButton id="reviews" icon={Star} label="Review Approvals" activeTab={activeTab} onClick={handleTabChange} />
              </div>
            </div>

            {/* Content Panels */}
            <div className="flex-1 min-w-0">
              
              {/* Tab 1: Analytics Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-350">
                  
                  {/* Monthly Period selector and title */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div className="text-left">
                      <h2 className="text-3xl font-extrabold text-leaf-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="text-leaf-600 dark:text-leaf-350" /> Analytics Dashboard
                      </h2>
                      <p className="text-xs text-leaf-900/60 dark:text-leaf-100/70 mt-1">Real-time KPI metric tracking, interactive sales charting, category breakups, and labor payroll cost tracker.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-leaf-900 px-3 py-1.5 rounded-xl border border-leaf-700/10 shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-leaf-900/60 dark:text-leaf-100/60">Period:</span>
                      <input 
                        type="month" 
                        value={`${currentAnalyticsDate.getFullYear()}-${String(currentAnalyticsDate.getMonth() + 1).padStart(2, '0')}`} 
                        onChange={(e) => {
                          if (e.target.value) {
                            setCurrentAnalyticsDate(new Date(e.target.value + '-01T00:00:00'));
                          }
                        }}
                        className="bg-transparent font-bold outline-none text-sm dark:text-white" 
                      />
                    </div>
                  </div>

                  {/* KPI Glassmorphism Cards Grid */}
                  <div className="grid gap-4 lg:gap-5 grid-cols-2 md:grid-cols-3">
                    {/* Today's Sales */}
                    <div className="glass rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group text-left">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-leaf-500/5 group-hover:scale-125 transition-transform duration-500" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xxs font-extrabold uppercase tracking-wider text-leaf-900/55 dark:text-leaf-100/60">Today's Sales</p>
                          <h3 className="text-2xl md:text-3xl font-black mt-2 text-leaf-950 dark:text-white">₹{todaySalesStats.total.toLocaleString()}</h3>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 shadow-inner shrink-0">
                          <DollarSign size={20} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] leading-none">
                        <span className={`font-extrabold flex items-center gap-0.5 ${todaySalesStats.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                          {todaySalesStats.trend === 'up' ? '▲' : '▼'} {Math.abs(Number(todaySalesStats.pct))}%
                        </span>
                        <span className="text-leaf-900/50 dark:text-leaf-100/50">vs yesterday (₹{todaySalesStats.yesterday})</span>
                      </div>
                    </div>

                    {/* Monthly Revenue */}
                    <div className="glass rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group text-left">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-leaf-500/5 group-hover:scale-125 transition-transform duration-500" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xxs font-extrabold uppercase tracking-wider text-leaf-900/55 dark:text-leaf-100/60">Monthly Revenue</p>
                          <h3 className="text-2xl md:text-3xl font-black mt-2 text-leaf-950 dark:text-white">₹{monthlyRevenueStats.total.toLocaleString()}</h3>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shadow-inner shrink-0">
                          <TrendingUp size={20} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] leading-none">
                        <span className={`font-extrabold flex items-center gap-0.5 ${monthlyRevenueStats.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                          {monthlyRevenueStats.trend === 'up' ? '▲' : '▼'} {Math.abs(Number(monthlyRevenueStats.pct))}%
                        </span>
                        <span className="text-leaf-900/50 dark:text-leaf-100/50">vs last month (₹{monthlyRevenueStats.lastMonth})</span>
                      </div>
                    </div>

                    {/* Plants in Inventory */}
                    <div className="glass rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group text-left">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-leaf-500/5 group-hover:scale-125 transition-transform duration-500" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xxs font-extrabold uppercase tracking-wider text-leaf-900/55 dark:text-leaf-100/60">Total Plants</p>
                          <h3 className="text-2xl md:text-3xl font-black mt-2 text-leaf-950 dark:text-white">{inventory.length}</h3>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 shadow-inner shrink-0">
                          <Leaf size={20} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] leading-none">
                        <span className="text-leaf-950 dark:text-white font-extrabold">{inventory.reduce((sum, p) => sum + (Number(p.stock) || 0), 0).toLocaleString()}</span>
                        <span className="text-leaf-900/50 dark:text-leaf-100/50">total stock units in store</span>
                      </div>
                    </div>

                    {/* Low Stock Products */}
                    <div className="glass rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group text-left">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-leaf-500/5 group-hover:scale-125 transition-transform duration-500" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xxs font-extrabold uppercase tracking-wider text-leaf-900/55 dark:text-leaf-100/60">Low Stock Items</p>
                          <h3 className="text-2xl md:text-3xl font-black mt-2 text-leaf-950 dark:text-white">{lowStockCount}</h3>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 shadow-inner shrink-0">
                          <AlertTriangle size={20} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] leading-none">
                        <span className={`font-extrabold ${lowStockCount > 0 ? 'text-amber-600 animate-pulse' : 'text-green-600'}`}>
                          {lowStockCount > 0 ? 'Reorder needed' : 'All items well-stocked'}
                        </span>
                        <span className="text-leaf-900/50 dark:text-leaf-100/50">(Stock ≤ 10)</span>
                      </div>
                    </div>

                    {/* Pending Reviews */}
                    <div className="glass rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group text-left">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-leaf-500/5 group-hover:scale-125 transition-transform duration-500" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xxs font-extrabold uppercase tracking-wider text-leaf-900/55 dark:text-leaf-100/60">Pending Reviews</p>
                          <h3 className="text-2xl md:text-3xl font-black mt-2 text-leaf-950 dark:text-white">{pendingReviewsCount}</h3>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500 dark:text-amber-300 shadow-inner shrink-0">
                          <Star size={20} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] leading-none">
                        <span className={`font-extrabold ${pendingReviewsCount > 0 ? 'text-amber-500 font-bold' : 'text-green-600'}`}>
                          {pendingReviewsCount > 0 ? 'Approvals pending' : 'Zero approvals pending'}
                        </span>
                      </div>
                    </div>

                    {/* Active Labour Count */}
                    <div className="glass rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 hover:-translate-y-1 transition-all duration-300 shadow-sm relative overflow-hidden group text-left">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-leaf-500/5 group-hover:scale-125 transition-transform duration-500" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xxs font-extrabold uppercase tracking-wider text-leaf-900/55 dark:text-leaf-100/60">Active Labour</p>
                          <h3 className="text-2xl md:text-3xl font-black mt-2 text-leaf-950 dark:text-white">{laboursCount}</h3>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 shadow-inner shrink-0">
                          <Users size={20} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] leading-none">
                        <span className="text-leaf-900/50 dark:text-leaf-100/50">Wages: Daily & Monthly rosters</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Payroll Roster breakdown */}
                  <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 border border-leaf-700/10 text-left">
                    <div className="mb-4 flex items-center justify-between border-b border-leaf-700/5 pb-3">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-leaf-950 dark:text-white">
                        <DollarSign className="text-green-600 shrink-0" size={19} /> Monthly Payroll Cost (₹)
                      </h3>
                      <span className="text-[10px] bg-leaf-100 dark:bg-leaf-800 text-leaf-900 dark:text-leaf-100 font-extrabold px-3 py-1 rounded-full uppercase">
                        {currentAnalyticsDate.toLocaleString('default', { month: 'short' })} {currentAnalyticsDate.getFullYear()}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/10 rounded-2xl p-4 flex flex-col justify-between">
                        <p className="text-xxs font-extrabold text-green-700 dark:text-green-400 uppercase">Total Wages Paid</p>
                        <p className="text-2xl font-black mt-1 text-green-800 dark:text-green-300">₹{payrollStats.paid.toLocaleString()}</p>
                      </div>
                      <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-2xl p-4 flex flex-col justify-between">
                        <p className="text-xxs font-extrabold text-amber-700 dark:text-amber-400 uppercase">Total Advances Disbursed</p>
                        <p className="text-2xl font-black mt-1 text-amber-800 dark:text-amber-300">₹{payrollStats.advances.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-2xl p-4 flex flex-col justify-between">
                        <p className="text-xxs font-extrabold text-red-700 dark:text-red-400 uppercase">Outstanding Payroll Balance</p>
                        <p className="text-2xl font-black mt-1 text-red-800 dark:text-red-300">₹{payrollStats.outstanding.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inventory category breakdown */}
                  <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 border border-leaf-700/10 text-left">
                    <div className="mb-4 border-b border-leaf-700/5 pb-3">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-leaf-950 dark:text-white">
                        <Package className="text-leaf-650 shrink-0" size={19} /> Plant Inventory Breakdown
                      </h3>
                    </div>
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
                      {Object.keys(inventoryBreakdown).map(catName => {
                        const stat = inventoryBreakdown[catName];
                        return (
                          <div key={catName} className="bg-leaf-500/5 dark:bg-leaf-500/15 rounded-2xl p-3 border border-leaf-700/5 text-center flex flex-col justify-between">
                            <p className="text-[10px] font-extrabold text-soil dark:text-leaf-300 uppercase truncate">{catName}</p>
                            <p className="text-xl font-black mt-1.5 text-leaf-900 dark:text-white">{stat.stock.toLocaleString()}</p>
                            <p className="text-[9px] text-leaf-900/50 dark:text-leaf-100/50 font-bold mt-1 uppercase">{stat.count} varieties</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Recharts Visualization Section */}
                  <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* AreaChart: Sales Volume Trend */}
                    <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 border border-leaf-700/10 flex flex-col justify-between text-left">
                      <div className="mb-4">
                        <h4 className="font-extrabold text-sm text-leaf-900 dark:text-white">Sales Volume Trend (Last 30 Days)</h4>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={last30DaysSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2d6f2c" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#2d6f2c" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,111,44,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <YAxis tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(45,111,44,0.15)', borderRadius: '12px', fontSize: 11, color: '#07130a' }} />
                            <Area type="monotone" dataKey="sales" name="Sales Amount (₹)" stroke="#2d6f2c" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* LineChart: Cumulative Last 30 Days Revenue */}
                    <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 border border-leaf-700/10 flex flex-col justify-between text-left">
                      <div className="mb-4">
                        <h4 className="font-extrabold text-sm text-leaf-900 dark:text-white">Cumulative Revenue Growth (30 Days)</h4>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cumulativeRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,111,44,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <YAxis tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(45,111,44,0.15)', borderRadius: '12px', fontSize: 11, color: '#07130a' }} />
                            <Line type="monotone" dataKey="revenue" name="Total Revenue (₹)" stroke="#06b6d4" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* BarChart: Daily Sales Graph */}
                    <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 border border-leaf-700/10 flex flex-col justify-between text-left">
                      <div className="mb-4">
                        <h4 className="font-extrabold text-sm text-leaf-900 dark:text-white">Daily Sales (Day-by-Day amount)</h4>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={last30DaysSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,111,44,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <YAxis tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(45,111,44,0.15)', borderRadius: '12px', fontSize: 11, color: '#07130a' }} />
                            <Bar dataKey="sales" name="Sales (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* BarChart: Monthly Growth Comparison */}
                    <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 border border-leaf-700/10 flex flex-col justify-between text-left">
                      <div className="mb-4">
                        <h4 className="font-extrabold text-sm text-leaf-900 dark:text-white">Monthly Sales Growth Comparison</h4>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,111,44,0.08)" />
                            <XAxis dataKey="monthName" tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <YAxis tick={{ fontSize: 9 }} stroke="rgba(45,111,44,0.4)" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(45,111,44,0.15)', borderRadius: '12px', fontSize: 11, color: '#07130a' }} />
                            <Bar dataKey="sales" name="Monthly Sales (₹)" fill="#4ade80" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* PieChart: Category Distribution */}
                    <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 border border-leaf-700/10 flex flex-col justify-between md:col-span-2 text-left">
                      <div className="mb-4">
                        <h4 className="font-extrabold text-sm text-leaf-900 dark:text-white">Plant Categories Variety Distribution</h4>
                      </div>
                      <div className="grid md:grid-cols-2 items-center gap-6">
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {categoryPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(45,111,44,0.15)', borderRadius: '12px', fontSize: 11, color: '#07130a' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-xxs font-extrabold text-soil dark:text-leaf-300 uppercase tracking-wider mb-2 text-left">Category Legend (Unique Product Counts)</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {categoryPieData.map((entry, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <span className="font-semibold text-leaf-950 dark:text-white">{entry.name}: {entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab 2: Plant Inventory */}
              {activeTab === 'plants' && (
                <div className="grid gap-8 2xl:grid-cols-[1.25fr_0.75fr] animate-in fade-in duration-300">
                  <div className="rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-lg dark:bg-leaf-900/60 text-left border border-leaf-700/5">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h2 className="flex items-center gap-2 text-2xl font-extrabold text-leaf-900 dark:text-white"><Leaf /> Plant Management</h2>
                      <label className="flex items-center gap-2 rounded-full bg-leaf-50 px-4 py-2 border border-leaf-700/10 dark:bg-[#0c2411]">
                        <Search size={17} />
                        <input 
                          placeholder="Search inventory" 
                          value={plantFilterQuery}
                          onChange={e => setPlantFilterQuery(e.target.value)}
                          className="bg-transparent outline-none text-sm" 
                        />
                      </label>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-leaf-50 text-sm uppercase tracking-[0.12em] dark:bg-[#0c2411]">
                          <tr>
                            <th className="p-4">Plant</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map((plant) => (
                            <tr key={plant._id} className="border-b border-leaf-700/10">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img src={plant.image} alt={plant.name} className="h-12 w-12 rounded-xl object-cover border border-leaf-700/10" />
                                  <div>
                                    <p className="font-bold">{plant.name}</p>
                                    <p className="text-xs text-leaf-900/60 dark:text-leaf-100/70">{plant.description}</p>
                                    {plant.scientificName && <span className="text-[10px] italic text-soil dark:text-leaf-300 font-bold">{plant.scientificName}</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">{plant.category}</td>
                              <td className="p-4 font-bold">₹{plant.price}</td>
                              <td className="p-4 font-bold">{plant.stock}</td>
                              <td className="p-4">
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${Number(plant.stock) <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-leaf-100 text-leaf-800 dark:bg-leaf-700 dark:text-white'}`}>
                                  {Number(plant.stock) <= 0 ? 'Out of Stock' : Number(plant.stock) <= 10 ? 'Low Stock' : 'Available'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <button onClick={() => {
                                    setForm({
                                      name: plant.name,
                                      scientificName: plant.scientificName || '',
                                      price: String(plant.price),
                                      stock: String(plant.stock),
                                      category: plant.category,
                                      description: plant.description || '',
                                      imageFile: null
                                    });
                                    alert("Edit details loaded to the form on the right. Modify values and click Save Plant.");
                                  }} className="grid h-9 w-9 place-items-center rounded-full bg-leaf-100 text-leaf-900 hover:bg-leaf-200"><Edit size={16} /></button>
                                  <button onClick={() => removePlant(plant._id)} className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-700 hover:bg-red-200"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    <form onSubmit={addPlant} className="rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-lg dark:bg-leaf-900/60 border border-leaf-700/5 text-left">
                      <h2 className="mb-5 flex items-center gap-2 text-2xl font-extrabold text-leaf-900 dark:text-white"><Plus /> Add New Plant</h2>
                      <div className="grid gap-3">
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plant name" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                        <input value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} placeholder="Scientific name" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none">
                          <option>Indoor</option><option>Outdoor</option><option>Flowering</option><option>Fruit</option><option>Medicinal</option><option>Farm</option>
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                          <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                          <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                        </div>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-leaf-700/40 px-4 py-6 font-bold text-leaf-700 dark:text-leaf-300">
                          <Image size={18} /> {form.imageFile ? "Image Selected" : "Upload plant image"}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setForm({...form, imageFile: e.target.files[0]})} />
                        </label>
                        <button className="btn-primary"><Plus size={18} /> Save Plant</button>
                      </div>
                    </form>
                  </aside>
                </div>
              )}

              {/* Tab 3: Billing System */}
              {activeTab === 'billing' && (
                <div className="grid gap-8 2xl:grid-cols-[1.25fr_0.75fr] animate-in fade-in duration-300">
                  <form onSubmit={saveBill} className="rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-lg dark:bg-leaf-900/60 border border-leaf-700/5 text-left">
                    <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <h2 className="flex items-center gap-2 text-2xl font-extrabold text-leaf-900 dark:text-white"><FileText /> Billing System</h2>
                      <select value={billForm.type} onChange={(event) => setBillForm({ ...billForm, type: event.target.value })} className="rounded-full border border-leaf-700/20 bg-transparent px-4 py-2 font-bold outline-none">
                        <option>Quotation</option>
                        <option>Bill</option>
                      </select>
                    </div>

                    <div className="mb-5 grid gap-3 md:grid-cols-3">
                      <input value={billForm.customerName} onChange={(event) => setBillForm({ ...billForm, customerName: event.target.value })} placeholder="Customer name" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                      <input value={billForm.customerPhone} onChange={(event) => setBillForm({ ...billForm, customerPhone: event.target.value })} placeholder="Customer phone" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                      <input type="date" value={billForm.date} onChange={(event) => setBillForm({ ...billForm, date: event.target.value })} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                    </div>

                    <div className="overflow-auto rounded-2xl border border-leaf-700/10">
                      <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-leaf-50 text-sm uppercase tracking-[0.12em] dark:bg-[#0c2411]">
                          <tr>
                            <th className="p-4">Plant Name</th>
                            <th className="p-4">Qty</th>
                            <th className="p-4">Rate</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billForm.lines.map((line, index) => (
                            <tr key={index} className="border-t border-leaf-700/10">
                              <td className="p-3">
                                <input list="plant-options" value={line.plantName} onChange={(event) => updateBillLine(index, 'plantName', event.target.value)} placeholder="Plant name" className="w-full rounded-xl border border-leaf-700/20 bg-transparent px-3 py-2 outline-none" />
                              </td>
                              <td className="p-3">
                                <input type="number" min="1" value={line.qty} onChange={(event) => updateBillLine(index, 'qty', event.target.value)} className="w-24 rounded-xl border border-leaf-700/20 bg-transparent px-3 py-2 outline-none" />
                              </td>
                              <td className="p-3">
                                <input type="number" min="0" value={line.rate} onChange={(event) => updateBillLine(index, 'rate', event.target.value)} className="w-28 rounded-xl border border-leaf-700/20 bg-transparent px-3 py-2 outline-none" />
                              </td>
                              <td className="p-3 font-extrabold">Rs. {(Number(line.qty || 0) * Number(line.rate || 0)).toLocaleString()}</td>
                              <td className="p-3">
                                <button type="button" onClick={() => removeBillLine(index)} className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-700 hover:bg-red-200"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <datalist id="plant-options">
                        {inventory.map((plant) => <option key={plant._id} value={plant.name} />)}
                      </datalist>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                      <textarea value={billForm.notes} onChange={(event) => setBillForm({ ...billForm, notes: event.target.value })} placeholder="Notes or terms" rows="3" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                      <div className="rounded-2xl bg-leaf-50 p-5 text-right dark:bg-[#0c2411]">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-leaf-900/60 dark:text-leaf-100/70">Total</p>
                        <p className="mt-2 text-4xl font-extrabold">Rs. {billTotal.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={addBillLine} className="btn-secondary"><Plus size={18} /> Add Item</button>
                      <button className="btn-primary"><FileText size={18} /> Save {billForm.type}</button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const draftBill = {
                            ...billForm,
                            number: `${billForm.type === 'Bill' ? 'BILL' : 'QT'}-DRAFT`,
                            total: billTotal,
                          };
                          setPreviewBill(draftBill);
                        }} 
                        className="btn-secondary"
                      >
                        <Printer size={18} /> Preview & Print
                      </button>
                    </div>
                  </form>

                  <div className="rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-lg dark:bg-leaf-900/60 border border-leaf-700/5 text-left">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h2 className="flex items-center gap-2 text-2xl font-extrabold text-leaf-900 dark:text-white"><FileText /> Bills & Quotations</h2>
                      <span className="rounded-full bg-leaf-100 px-4 py-2 text-sm font-bold text-leaf-900 dark:bg-leaf-700 dark:text-white">{bills.length}</span>
                    </div>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                      {bills.length === 0 && <p className="rounded-2xl bg-leaf-50 p-5 text-leaf-900/70 dark:bg-[#0c2411] dark:text-leaf-100/75">No bills or quotations saved yet.</p>}
                      {bills.map((bill) => (
                        <article key={bill.id} className="rounded-2xl border border-leaf-700/10 bg-leaf-50 p-5 dark:bg-[#0c2411] hover:shadow transition">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-soil dark:text-leaf-300">{bill.type}</p>
                              <h3 className="text-xl font-extrabold">{bill.number}</h3>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="font-extrabold">Rs. {bill.total.toLocaleString()}</span>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setPreviewBill(bill)} 
                                  className="grid h-8 w-8 place-items-center rounded-full bg-leaf-100 text-leaf-900 hover:bg-leaf-200 dark:bg-leaf-800 dark:text-leaf-100"
                                  title="Preview & Print"
                                >
                                  <Printer size={14} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => deleteBill(bill.id)} 
                                  className="grid h-8 w-8 place-items-center rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="font-bold">{bill.customerName}</p>
                          <p className="text-sm text-leaf-900/60 dark:text-leaf-100/70">{bill.customerPhone || 'No phone'} · {bill.date}</p>
                          <div className="mt-3 space-y-1 text-sm border-t border-leaf-700/5 pt-2">
                            {bill.lines.map((line, index) => (
                              <p key={index} className="text-xs text-leaf-900/80 dark:text-leaf-100/80">{line.plantName} · {line.qty} x Rs. {Number(line.rate).toLocaleString()}</p>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Past Work Projects */}
              {activeTab === 'projects' && (
                <div className="grid gap-8 2xl:grid-cols-[0.75fr_1.25fr] animate-in fade-in duration-300">
                  <form onSubmit={addOrUpdateProject} className="rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-lg dark:bg-leaf-900/60 border border-leaf-700/5 text-left">
                    <h2 className="mb-5 flex items-center gap-2 text-2xl font-extrabold text-leaf-900 dark:text-white">
                      <BriefcaseBusiness /> {editingProjectId ? 'Edit Past Work' : 'Add Past Work'}
                    </h2>
                    <div className="grid gap-3">
                      <input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="Project title" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                      <select value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none">
                        <option>Garden Design</option><option>Landscaping</option><option>Farm Work</option><option>Nursery</option>
                      </select>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} placeholder="Location" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                        <input value={projectForm.duration} onChange={(e) => setProjectForm({ ...projectForm, duration: e.target.value })} placeholder="Duration" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                      </div>
                      
                      {/* Plants Used Component */}
                      <div className="rounded-xl border border-leaf-700/20 p-4 bg-transparent relative">
                        <label className="block text-sm font-bold text-leaf-900 dark:text-leaf-100 mb-2">Plants Used</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(!projectForm.plantsUsed || projectForm.plantsUsed.length === 0) ? (
                            <span className="text-xs text-leaf-900/50 dark:text-leaf-100/50 italic">No plants added yet. Search below or type custom name.</span>
                          ) : (
                            projectForm.plantsUsed.map((plantName, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 dark:bg-leaf-800 px-3 py-1 text-xs font-bold text-leaf-900 dark:text-leaf-100">
                                {plantName}
                                <button type="button" onClick={() => handleRemovePlantTag(plantName)} className="text-red-500 hover:text-red-700 font-extrabold focus:outline-none ml-1 text-sm">&times;</button>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <div className="flex items-center gap-2 rounded-xl border border-leaf-700/20 bg-transparent px-3 py-2">
                              <Search size={16} className="text-leaf-900/40 dark:text-leaf-100/40" />
                              <input 
                                type="text" 
                                value={plantSearchQuery} 
                                onChange={(e) => {
                                  setPlantSearchQuery(e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => {
                                  setTimeout(() => setShowSuggestions(false), 200);
                                }}
                                placeholder="Search plant inventory..." 
                                className="w-full bg-transparent text-sm outline-none" 
                              />
                            </div>
                            {showSuggestions && plantSearchQuery.trim() && (
                              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-leaf-700/20 bg-white dark:bg-leaf-900 shadow-xl z-20">
                                {inventory
                                  .filter(p => p.name.toLowerCase().includes(plantSearchQuery.toLowerCase()) && !projectForm.plantsUsed.includes(p.name))
                                  .map((plant) => (
                                    <button type="button" key={plant._id} onClick={() => handleAddPlantTag(plant.name)} className="w-full text-left px-4 py-2 text-sm hover:bg-leaf-50 dark:hover:bg-leaf-800 transition-colors font-semibold">
                                      {plant.name} <span className="text-xs text-leaf-900/50 dark:text-leaf-100/50 font-normal">({plant.category})</span>
                                    </button>
                                  ))
                                }
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => handleAddPlantTag(plantSearchQuery)} className="btn-secondary py-2 px-4 text-xs font-bold shrink-0">Add Custom</button>
                        </div>
                      </div>

                      {/* Additional Photos Section */}
                      <div className="rounded-xl border border-leaf-700/20 p-4 bg-transparent">
                        <label className="block text-sm font-bold text-leaf-900 dark:text-leaf-100 mb-2">Additional Project Photos</label>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {(projectForm.additionalImages || []).map((url, idx) => (
                            <div key={`url-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-leaf-700/10">
                              <img src={url} alt="project extra" className="h-full w-full object-cover" />
                              <button type="button" onClick={() => removeAdditionalImage('url', idx)} className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold"><Trash2 size={16} /></button>
                            </div>
                          ))}
                          {(projectForm.additionalImageFiles || []).map((file, idx) => {
                            const localUrl = URL.createObjectURL(file);
                            return (
                              <div key={`file-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-leaf-700/10">
                                <img src={localUrl} alt="project extra local" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removeAdditionalImage('file', idx)} className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold"><Trash2 size={16} /></button>
                              </div>
                            );
                          })}
                          <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-leaf-700/30 hover:border-leaf-700/60 cursor-pointer bg-leaf-50/50 dark:bg-leaf-900/20 text-leaf-700 dark:text-leaf-300">
                            <Plus size={20} />
                            <span className="text-[10px] mt-1 text-center font-bold">Add Photo</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAdditionalPhotosUpload(e.target.files)} />
                          </label>
                        </div>
                      </div>

                      <textarea value={projectForm.scope} onChange={(e) => setProjectForm({ ...projectForm, scope: e.target.value })} placeholder="Work details and scope" rows="4" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                      <textarea value={projectForm.result} onChange={(e) => setProjectForm({ ...projectForm, result: e.target.value })} placeholder="Project result shown on website" rows="3" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                      <div className="grid gap-3 md:grid-cols-2">
                        <UploadBox label="Before image" preview={projectForm.before} onChange={(file) => handleProjectImage('before', file)} />
                        <UploadBox label="After / main image" preview={projectForm.after} onChange={(file) => handleProjectImage('after', file)} />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button disabled={isSavingProject} className="btn-primary">
                          {isSavingProject ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                              {editingProjectId ? 'Updating...' : 'Saving...'}
                            </>
                          ) : (
                            <>
                              <Plus size={18} /> {editingProjectId ? 'Update Work' : 'Save Work'}
                            </>
                          )}
                        </button>
                        {editingProjectId && (
                          <button type="button" onClick={() => { setEditingProjectId(null); setProjectForm(emptyProjectForm); }} className="btn-secondary">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>

                  <div className="rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-lg dark:bg-leaf-900/60 border border-leaf-700/5 text-left">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h2 className="flex items-center gap-2 text-2xl font-extrabold text-leaf-900 dark:text-white"><BriefcaseBusiness /> Past Work Management</h2>
                      <span className="rounded-full bg-leaf-100 px-4 py-2 text-sm font-bold text-leaf-900 dark:bg-leaf-700 dark:text-white">{managedProjects.length} works</span>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2 max-h-[75vh] overflow-y-auto pr-1">
                      {managedProjects.map((project) => (
                        <article key={project.id} className="overflow-hidden rounded-2xl border border-leaf-700/10 bg-leaf-50 dark:bg-[#0c2411] hover:shadow transition">
                          <img src={project.after} alt={project.title} className="h-52 w-full object-cover" />
                          <div className="p-5">
                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-soil dark:text-leaf-300">{project.category}</p>
                            <h3 className="mt-2 text-xl font-extrabold">{project.title}</h3>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-leaf-900/70 dark:text-leaf-100/75">{project.scope}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button onClick={() => editProject(project)} className="rounded-full bg-leaf-700 px-4 py-2 text-sm font-bold text-white hover:brightness-110"><Edit size={15} className="inline" /> Edit</button>
                              <button onClick={() => removeProject(project.id)} className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"><Trash2 size={15} className="inline" /> Delete</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Labour ERP */}
              {activeTab === 'labour' && (
                <div className="print-labour-wrapper animate-in fade-in duration-300">
                  <LabourRegister />
                </div>
              )}

              {/* Tab 6: Review Approvals */}
              {activeTab === 'reviews' && (
                <div className="max-w-4xl mx-auto rounded-[1.5rem] md:rounded-[2.5rem] bg-white p-4 md:p-6 shadow-lg dark:bg-leaf-900/60 border border-leaf-700/5 text-left animate-in fade-in duration-300">
                  <h2 className="mb-5 flex items-center gap-2 text-2xl font-extrabold text-leaf-900 dark:text-white"><Star /> Review Approvals</h2>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {adminReviews.length === 0 && <p className="text-sm text-leaf-900/60 dark:text-leaf-100/70 p-5 text-center">No reviews found in the database.</p>}
                    {adminReviews.map((review) => (
                      <div key={review.id} className="mb-3 rounded-2xl bg-leaf-50 p-5 dark:bg-[#0c2411] border border-leaf-700/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow transition">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-bold text-lg">{review.name}</p>
                            {review.approved ? (
                              <span className="text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">Approved</span>
                            ) : (
                              <span className="text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">Pending Approval</span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-leaf-900/80 dark:text-leaf-100/85">{review.text}</p>
                          <div className="flex text-yellow-400 mt-2">
                            {Array.from({ length: Number(review.rating || 5) }).map((_, i) => (
                              <Star key={i} size={14} className="fill-current" />
                            ))}
                          </div>
                        </div>
                        {review.plantPhoto && (
                          <img src={review.plantPhoto} alt="Review plant" className="h-16 w-16 rounded-xl object-cover border border-leaf-700/10" />
                        )}
                        <div className="flex gap-2 shrink-0">
                          {!review.approved && (
                            <button onClick={() => approveReview(review.id)} type="button" className="rounded-full bg-leaf-700 hover:brightness-110 px-4 py-2 text-xs font-bold text-white"><Check size={14} className="inline mr-1" /> Approve</button>
                          )}
                          <button onClick={() => deleteReview(review.id)} type="button" className="rounded-full bg-red-100 hover:bg-red-200 px-4 py-2 text-xs font-bold text-red-700">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Print Preview Modal */}
      {previewBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 print-preview-modal">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-leaf-900 border border-leaf-700/10 print-preview-modal-content">
            
            {/* Modal Settings Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-leaf-700/10 pb-4 no-print">
              <div>
                <h3 className="text-xl font-bold dark:text-white">Print Preview ({previewBill.type})</h3>
                <p className="text-sm text-leaf-900/60 dark:text-leaf-100/70">Configure your print settings below</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold dark:text-leaf-200">Letterhead:</span>
                  <select 
                    value={letterheadType} 
                    onChange={(e) => saveLetterheadSettings(e.target.value)}
                    className="rounded-full border border-leaf-700/20 bg-transparent px-3 py-1.5 text-sm font-bold outline-none dark:text-white dark:bg-leaf-800"
                  >
                    <option value="digital">Digital (Logo & Details)</option>
                    <option value="custom">Custom Image Banner</option>
                    <option value="none">Blank (Pre-printed Paper)</option>
                  </select>
                </div>

                {letterheadType === 'custom' && (
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1.5 text-xs font-bold text-leaf-900 hover:bg-leaf-200 dark:bg-leaf-700 dark:text-white transition-colors">
                    {uploadingLetterhead ? "Uploading..." : "Upload Banner"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLetterheadUpload} disabled={uploadingLetterhead} />
                  </label>
                )}

                <button 
                  type="button"
                  onClick={() => {
                    const isDark = document.documentElement.classList.contains('dark');
                    if (isDark) document.documentElement.classList.remove('dark');
                    document.body.classList.add('printing-bill');
                    setTimeout(() => {
                      window.print();
                      document.body.classList.remove('printing-bill');
                      if (isDark) document.documentElement.classList.add('dark');
                    }, 50);
                  }} 
                  className="btn-primary py-2 px-5 text-sm"
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
                
                <button 
                  type="button"
                  onClick={() => setPreviewBill(null)} 
                  className="btn-secondary py-2 px-5 text-sm"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable Bill Content (What actually gets printed) */}
            <div className="max-h-[70vh] overflow-y-auto rounded-2xl bg-gray-50 p-4 dark:bg-black/20 print-preview-scroll-wrapper">
              <div className="print-bill-container relative mx-auto max-w-[800px] border border-gray-300 bg-white p-8 font-sans text-black shadow-sm rounded-xl overflow-hidden min-h-[297mm]">
                
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05] z-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="450" height="450" fill="none" stroke="#2d6f2c" strokeWidth="0.8">
                    <path d="M50,90 C50,60 40,40 50,10 C53,30 65,35 60,45 C55,55 75,50 70,65 C65,80 55,85 50,90 Z" fill="#2d6f2c" fillOpacity="0.1" />
                    <path d="M50,90 C50,60 60,40 50,10 C47,30 35,35 40,45 C45,55 25,50 30,65 C35,80 45,85 50,90 Z" fill="#2d6f2c" fillOpacity="0.1" />
                    <circle cx="50" cy="35" r="15" stroke="#ef4444" strokeWidth="0.8" fill="#ef4444" fillOpacity="0.05" />
                    <circle cx="45" cy="30" r="10" stroke="#ef4444" strokeWidth="0.8" fill="#ef4444" fillOpacity="0.05" />
                    <circle cx="55" cy="30" r="10" stroke="#ef4444" strokeWidth="0.8" fill="#ef4444" fillOpacity="0.05" />
                  </svg>
                </div>

                <div className="relative z-10">
                  {/* LETTERHEAD AREA */}
                  {letterheadType === 'digital' && (
                    <div className="mb-6 border-b border-gray-300 pb-4 flex items-center justify-start gap-6">
                      <img 
                        src="/images/kaveri_logo.jpeg" 
                        alt="Kaveri Nursery Logo" 
                        className="h-24 w-24 object-contain" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="flex-1">
                        <h1 className="text-4xl font-extrabold tracking-wide text-green-700 font-serif" style={{ color: '#2d6f2c', fontFamily: "'Playfair Display', serif" }}>
                          Kaveri Nursery & Garden Centre
                        </h1>
                        <p className="text-sm font-bold mt-1 text-red-500" style={{ color: '#e11d48' }}>
                          Mob. No. <span className="underline">9284771249</span> Email- <span className="underline">Kaverinursery@gmail.com</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {letterheadType === 'custom' && (
                    <div className="mb-6">
                      {customLetterheadUrl ? (
                        <img src={customLetterheadUrl} alt="Custom Letterhead" className="w-full object-contain max-h-[160px] mx-auto rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 py-10 bg-gray-50 rounded-xl">
                          <p className="text-sm font-bold text-gray-500">No custom letterhead image uploaded yet.</p>
                          <p className="text-xs text-gray-400 mt-1">Please use the Upload button above to add your header image.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {letterheadType === 'none' && (
                    <div className="h-[60mm] flex items-center justify-center border border-dashed border-gray-200 mb-6 relative rounded-lg bg-gray-50/50">
                      <span className="text-xs text-gray-300 select-none absolute top-2 left-2 font-mono">Blank Letterhead Space (60mm / 2.5")</span>
                    </div>
                  )}

                  {/* INVOICE TITLE & DATE */}
                  <div className="relative text-center my-6">
                    <h2 className="text-xl font-bold tracking-wider text-gray-800 uppercase">
                      {previewBill.type}
                    </h2>
                    <div className="absolute right-0 top-0 text-sm font-bold text-gray-800">
                      Date: {formatDate(previewBill.date)}
                    </div>
                  </div>

                  {/* CUSTOMER INFO */}
                  <div className="mb-6 text-left text-sm font-bold text-gray-800 space-y-1">
                    <p className="text-gray-700">TO,</p>
                    <p className="mt-1 text-base font-extrabold text-gray-900">{previewBill.customerName}</p>
                    {previewBill.customerPhone && <p className="text-xs text-gray-600 font-normal">Phone: {previewBill.customerPhone}</p>}
                  </div>

                  {/* INVOICE ITEMS TABLE */}
                  <table className="w-full border-collapse border border-black text-left text-sm mb-6">
                    <thead>
                      <tr className="bg-gray-50 text-black border-b border-black font-bold">
                        <th className="border border-black p-2.5 w-14 text-center">Sr. No.</th>
                        <th className="border border-black p-2.5">Plant Name</th>
                        <th className="border border-black p-2.5 w-20 text-center">Qty</th>
                        <th className="border border-black p-2.5 w-28 text-center">Rate</th>
                        <th className="border border-black p-2.5 w-32 text-center">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewBill.lines.map((line, idx) => (
                        <tr key={idx} className="border-b border-black">
                          <td className="border border-black p-2 text-center">{idx + 1}</td>
                          <td className="border border-black p-2 font-medium">{line.plantName}</td>
                          <td className="border border-black p-2 text-center">{line.qty}</td>
                          <td className="border border-black p-2 text-center">
                            {Number(line.rate) % 1 === 0 ? `${Number(line.rate)}/-` : `${Number(line.rate).toFixed(2)}/-`}
                          </td>
                          <td className="border border-black p-2 text-center font-bold">
                            {Number(line.qty * line.rate) % 1 === 0 
                              ? `${Number(line.qty * line.rate)}/-` 
                              : `${Number(line.qty * line.rate).toFixed(2)}/-`}
                          </td>
                        </tr>
                      ))}
                      {/* Grand Total Row */}
                      <tr className="font-extrabold border-t border-black bg-gray-50">
                        <td colSpan="2" className="border border-black p-2.5 text-right font-bold text-gray-800">Total Amount:</td>
                        <td className="border border-black p-2.5 text-center font-bold">
                          {previewBill.lines.reduce((sum, l) => sum + Number(l.qty || 0), 0)}
                        </td>
                        <td className="border border-black p-2.5 text-center"></td>
                        <td className="border border-black p-2.5 text-center font-extrabold text-lg text-black">
                          {Number(previewBill.total) % 1 === 0 
                            ? `${Number(previewBill.total)}/-` 
                            : `${Number(previewBill.total).toFixed(2)}/-`}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* NOTES & TERMS */}
                  {previewBill.notes && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg text-xs leading-relaxed text-gray-600">
                      <p className="font-bold text-gray-700 mb-1">Notes / Terms & Conditions:</p>
                      <p className="whitespace-pre-line">{previewBill.notes}</p>
                    </div>
                  )}

                  {/* SIGNATURE SECTION */}
                  <div className="mt-12 flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                      <p>Thank you for your business!</p>
                      <p className="mt-1">For queries, call: 9284771249</p>
                    </div>
                    <div className="text-center w-52">
                      <div className="h-16 border-b border-gray-300 mb-2"></div>
                      <p className="text-xs font-bold text-gray-800">For Kaveri Nursery</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Authorized Signatory</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      )}

    </main>
  );
}

function TabButton({ id, icon: Icon, label, activeTab, onClick }) {
  const isActive = activeTab === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`flex items-center gap-2.5 whitespace-nowrap shrink-0 lg:w-full text-left px-4 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold transition-all duration-300 ${
        isActive 
          ? 'bg-leaf-700 text-white shadow-md' 
          : 'text-leaf-900/70 hover:text-leaf-900 hover:bg-leaf-50 dark:text-leaf-300 dark:hover:text-white dark:hover:bg-leaf-800'
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function UploadBox({ label, preview, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-leaf-700/40 p-4 text-center font-bold text-leaf-700 dark:text-leaf-300">
      {preview ? <img src={preview} alt={label} className="h-32 w-full rounded-lg object-cover" /> : <Image size={24} />}
      <span>{label}</span>
      <input type="file" accept="image/*" className="hidden" onChange={(event) => onChange(event.target.files?.[0])} />
    </label>
  );
}

function apiProjectToUi(project) {
  return {
    id: project._id || project.id,
    title: project.title,
    category: project.category,
    location: project.location || '',
    duration: project.duration || '',
    scope: project.scope || project.description || '',
    plantsUsed: project.plantsUsed || [],
    result: project.result || project.description || '',
    before: project.beforeImage || project.image || '',
    after: project.afterImage || project.image || '',
    additionalImages: project.additionalImages || []
  };
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-6">
      <Icon className="mb-4 text-leaf-700 dark:text-leaf-300" />
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-leaf-900/60 dark:text-leaf-100/70">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-extrabold"><Icon /> {title}</h2>
      {children}
    </div>
  );
}
