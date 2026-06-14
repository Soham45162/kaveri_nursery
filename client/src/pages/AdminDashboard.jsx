import { BarChart3, Bell, BriefcaseBusiness, Check, Edit, FileText, Image, Leaf, LogOut, Package, Plus, Printer, Search, ShoppingBag, Star, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext.jsx';
import { db, storage } from '../config/firebase.js';
import { plants, projects, reviews } from '../data/sampleData.js';

const emptyBillLine = { plantName: '', qty: 1, rate: 0 };
const emptyBillForm = {
  type: 'Quotation',
  customerName: '',
  customerPhone: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  lines: [emptyBillLine]
};

const emptyProjectForm = {
  title: '',
  category: 'Garden Design',
  location: '',
  duration: '',
  budget: '',
  scope: '',
  plantsUsed: '',
  result: '',
  before: '',
  after: '',
  beforeFile: null,
  afterFile: null
};

export default function AdminDashboard() {
  const { logout, token, user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [managedProjects, setManagedProjects] = useState([]);
  const [form, setForm] = useState({ name: '', scientificName: '', price: '', stock: '', category: 'Indoor', description: '', imageFile: null });
  const [billForm, setBillForm] = useState(emptyBillForm);
  const [bills, setBills] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [editingProjectId, setEditingProjectId] = useState(null);

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
      } catch (error) {
        console.error("Error loading admin data", error);
      }
    }
    loadData();
  }, []);

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
    if (!projectForm.title || !projectForm.after || !projectForm.scope) return;

    let beforeUrl = projectForm.before;
    let afterUrl = projectForm.after;

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

      const projectData = {
        title: projectForm.title,
        category: projectForm.category,
        location: projectForm.location,
        duration: projectForm.duration,
        budget: projectForm.budget,
        scope: projectForm.scope,
        plantsUsed: projectForm.plantsUsed.split(',').map((item) => item.trim()).filter(Boolean),
        result: projectForm.result,
        beforeImage: beforeUrl,
        afterImage: afterUrl,
        description: projectForm.result
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
      setEditingProjectId(null);
      setProjectForm(emptyProjectForm);
    } catch (error) {
      console.error("Error saving project", error);
    }
  };

  const editProject = (project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      category: project.category,
      location: project.location,
      duration: project.duration,
      budget: project.budget,
      scope: project.scope,
      plantsUsed: project.plantsUsed.join(', '),
      result: project.result,
      before: project.before,
      after: project.after,
      beforeFile: null,
      afterFile: null
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

  const saveBill = (event) => {
    event.preventDefault();
    if (!billForm.customerName || billForm.lines.some((line) => !line.plantName)) return;
    const bill = {
      ...billForm,
      id: crypto.randomUUID(),
      number: `${billForm.type === 'Bill' ? 'BILL' : 'QT'}-${String(bills.length + 1).padStart(4, '0')}`,
      total: billTotal,
      createdAt: new Date().toLocaleString()
    };
    setBills((current) => [bill, ...current]);
    setBillForm(emptyBillForm);
  };

  return (
    <main className="pt-24">
      <section className="section-pad bg-leaf-50 dark:bg-[#0c2411]">
        <div className="container-page">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-soil dark:text-leaf-300">Secure Dashboard</p>
              <h1 className="font-display text-5xl font-extrabold">Welcome, {user?.name || 'Owner'}</h1>
            </div>
            <button onClick={logout} className="btn-secondary"><LogOut size={18} /> Logout</button>
          </div>

          <div className="mb-8 grid gap-5 md:grid-cols-4">
            <Metric icon={ShoppingBag} label="Monthly Sales" value="₹2.8L" />
            <Metric icon={Users} label="Visitors" value="18.4K" />
            <Metric icon={Package} label="Inventory" value={inventory.length} />
            <Metric icon={Bell} label="Notifications" value="12" />
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_0.7fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold"><Leaf /> Plant Management</h2>
                <label className="hidden items-center gap-2 rounded-full bg-leaf-50 px-4 py-2 dark:bg-[#0c2411] md:flex">
                  <Search size={17} />
                  <input placeholder="Search inventory" className="bg-transparent outline-none" />
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
                    {inventory.map((plant) => (
                      <tr key={plant._id} className="border-b border-leaf-700/10">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={plant.image} alt={plant.name} className="h-12 w-12 rounded-xl object-cover" />
                            <div><p className="font-bold">{plant.name}</p><p className="text-sm text-leaf-900/60 dark:text-leaf-100/70">{plant.description}</p></div>
                          </div>
                        </td>
                        <td className="p-4">{plant.category}</td>
                        <td className="p-4">₹{plant.price}</td>
                        <td className="p-4">{plant.stock}</td>
                        <td className="p-4"><span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-bold text-leaf-800 dark:bg-leaf-700 dark:text-white">Available</span></td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button className="grid h-9 w-9 place-items-center rounded-full bg-leaf-100 text-leaf-900"><Edit size={16} /></button>
                            <button onClick={() => removePlant(plant._id)} className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-700"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="space-y-6">
              <form onSubmit={addPlant} className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-extrabold"><Plus /> Add New Plant</h2>
                <div className="grid gap-3">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plant name" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                  <input value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} placeholder="Scientific name" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none">
                    <option>Indoor</option><option>Outdoor</option><option>Flowering</option><option>Fruit</option><option>Medicinal</option>
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

              <Panel title="Review Approvals" icon={Star}>
                {adminReviews.length === 0 && <p className="text-sm text-leaf-900/60 dark:text-leaf-100/70">No reviews found.</p>}
                {adminReviews.map((review) => (
                  <div key={review.id} className="mb-3 rounded-xl bg-leaf-50 p-4 dark:bg-[#0c2411]">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold">{review.name}</p>
                      {review.approved ? <span className="text-xs font-bold text-leaf-700 dark:text-leaf-300">Approved</span> : <span className="text-xs font-bold text-yellow-600">Pending</span>}
                    </div>
                    <p className="line-clamp-2 text-sm text-leaf-900/70 dark:text-leaf-100/75">{review.text}</p>
                    <div className="mt-3 flex gap-2">
                      {!review.approved && (
                        <button onClick={() => approveReview(review.id)} type="button" className="rounded-full bg-leaf-700 px-3 py-1 text-sm font-bold text-white"><Check size={14} className="inline" /> Approve</button>
                      )}
                      <button onClick={() => deleteReview(review.id)} type="button" className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">Delete</button>
                    </div>
                  </div>
                ))}
              </Panel>
            </aside>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Panel title="Sales Analytics" icon={BarChart3}><div className="h-44 rounded-xl bg-gradient-to-t from-leaf-700 to-leaf-300" /></Panel>
            <Panel title="Orders" icon={ShoppingBag}><p>32 active orders, 8 ready for delivery, 4 pending payment confirmations.</p></Panel>
            <Panel title="Customers" icon={Users}><p>Customer list, order history, newsletter subscriptions, and live chat leads are API-ready.</p></Panel>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_0.75fr]">
            <form onSubmit={saveBill} className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold"><FileText /> Billing System</h2>
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
                          <button type="button" onClick={() => removeBillLine(index)} className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-700"><Trash2 size={16} /></button>
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
                <button type="button" onClick={() => window.print()} className="btn-secondary"><Printer size={18} /> Print</button>
              </div>
            </form>

            <div className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold"><FileText /> Bills & Quotations</h2>
                <span className="rounded-full bg-leaf-100 px-4 py-2 text-sm font-bold text-leaf-900 dark:bg-leaf-700 dark:text-white">{bills.length}</span>
              </div>
              <div className="space-y-4">
                {bills.length === 0 && <p className="rounded-2xl bg-leaf-50 p-5 text-leaf-900/70 dark:bg-[#0c2411] dark:text-leaf-100/75">No bills or quotations saved yet.</p>}
                {bills.map((bill) => (
                  <article key={bill.id} className="rounded-2xl border border-leaf-700/10 bg-leaf-50 p-5 dark:bg-[#0c2411]">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-soil dark:text-leaf-300">{bill.type}</p>
                        <h3 className="text-xl font-extrabold">{bill.number}</h3>
                      </div>
                      <span className="font-extrabold">Rs. {bill.total.toLocaleString()}</span>
                    </div>
                    <p className="font-bold">{bill.customerName}</p>
                    <p className="text-sm text-leaf-900/60 dark:text-leaf-100/70">{bill.customerPhone || 'No phone'} · {bill.date}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      {bill.lines.map((line, index) => (
                        <p key={index}>{line.plantName} · {line.qty} x Rs. {Number(line.rate).toLocaleString()}</p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[0.75fr_1.25fr]">
            <form onSubmit={addOrUpdateProject} className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-extrabold">
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
                <input value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} placeholder="Package or budget type" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                <input value={projectForm.plantsUsed} onChange={(e) => setProjectForm({ ...projectForm, plantsUsed: e.target.value })} placeholder="Plants used, comma separated" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                <textarea value={projectForm.scope} onChange={(e) => setProjectForm({ ...projectForm, scope: e.target.value })} placeholder="Work details and scope" rows="4" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                <textarea value={projectForm.result} onChange={(e) => setProjectForm({ ...projectForm, result: e.target.value })} placeholder="Project result shown on website" rows="3" className="rounded-xl border border-leaf-700/20 bg-transparent px-4 py-3 outline-none" />
                <div className="grid gap-3 md:grid-cols-2">
                  <UploadBox label="Before image" preview={projectForm.before} onChange={(file) => handleProjectImage('before', file)} />
                  <UploadBox label="After / main image" preview={projectForm.after} onChange={(file) => handleProjectImage('after', file)} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary"><Plus size={18} /> {editingProjectId ? 'Update Work' : 'Save Work'}</button>
                  {editingProjectId && (
                    <button type="button" onClick={() => { setEditingProjectId(null); setProjectForm(emptyProjectForm); }} className="btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold"><BriefcaseBusiness /> Past Work Management</h2>
                <span className="rounded-full bg-leaf-100 px-4 py-2 text-sm font-bold text-leaf-900 dark:bg-leaf-700 dark:text-white">{managedProjects.length} works</span>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                {managedProjects.map((project) => (
                  <article key={project.id} className="overflow-hidden rounded-2xl border border-leaf-700/10 bg-leaf-50 dark:bg-[#0c2411]">
                    <img src={project.after} alt={project.title} className="h-52 w-full object-cover" />
                    <div className="p-5">
                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-soil dark:text-leaf-300">{project.category}</p>
                      <h3 className="mt-2 text-xl font-extrabold">{project.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-leaf-900/70 dark:text-leaf-100/75">{project.scope}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => editProject(project)} className="rounded-full bg-leaf-700 px-4 py-2 text-sm font-bold text-white"><Edit size={15} className="inline" /> Edit</button>
                        <button onClick={() => removeProject(project.id)} className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700"><Trash2 size={15} className="inline" /> Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
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
    budget: project.budget || '',
    scope: project.scope || project.description || '',
    plantsUsed: project.plantsUsed || [],
    result: project.result || project.description || '',
    before: project.beforeImage || project.image || '',
    after: project.afterImage || project.image || ''
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
