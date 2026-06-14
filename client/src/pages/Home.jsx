import { motion } from 'framer-motion';
import { Award, CalendarClock, CheckCircle2, Leaf, Mail, MapPin, MessageCircle, Phone, Search, Sparkles, Star, Trees, Users, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { blogs, businessInfo, faqs, heroImage, owner } from '../data/sampleData.js';
import PlantCard from '../components/PlantCard.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import StatCard from '../components/StatCard.jsx';

import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase.js';

const projectCategories = ['All', 'Landscaping', 'Garden Design', 'Farm Work'];
const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(businessInfo.mapQuery)}&output=embed`;
const whatsappLink = (message) => `https://wa.me/${businessInfo.whatsappNumber}?text=${encodeURIComponent(message)}`;

export default function Home() {
  const [plantQuery, setPlantQuery] = useState('');
  const [plantCategory, setPlantCategory] = useState('All');
  const [projectCategory, setProjectCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [livePlants, setLivePlants] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, text: '', plantPhoto: null, previewUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const plantSnap = await getDocs(collection(db, 'plants'));
        if (!plantSnap.empty) setLivePlants(plantSnap.docs.map(d => ({ _id: d.id, ...d.data() })));

        const projSnap = await getDocs(collection(db, 'gallery'));
        if (!projSnap.empty) {
          setLiveProjects(projSnap.docs.map(d => ({ 
            id: d.id, 
            ...d.data(), 
            before: d.data().beforeImage || '', 
            after: d.data().afterImage || d.data().image || '' 
          })));
        }

        const revSnap = await getDocs(collection(db, 'reviews'));
        if (!revSnap.empty) {
          const approved = revSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.approved);
          setCustomerReviews(approved);
        }
      } catch (error) {
         console.error(error);
      }
    }
    loadData();
  }, []);

  const plantCategories = ['All', ...new Set(livePlants.map((plant) => plant.category))];

  const filteredPlants = useMemo(() => {
    return livePlants.filter((plant) => {
      const matchesQuery = [plant.name, plant.scientificName, plant.category].join(' ').toLowerCase().includes(plantQuery.toLowerCase());
      const matchesCategory = plantCategory === 'All' || plant.category === plantCategory;
      return matchesQuery && matchesCategory;
    });
  }, [plantQuery, plantCategory, livePlants]);

  const filteredProjects = liveProjects.filter((project) => projectCategory === 'All' || project.category === projectCategory);
  const averageRating = customerReviews.length > 0 ? (customerReviews.reduce((sum, review) => sum + Number(review.rating), 0) / customerReviews.length).toFixed(1) : "5.0";

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewForm.name || !reviewForm.text) return;
    setIsSubmitting(true);

    let uploadedUrl = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80';
    if (reviewForm.plantPhoto) {
      try {
         const imageRef = ref(storage, `reviews/${Date.now()}`);
         await uploadBytes(imageRef, reviewForm.plantPhoto);
         uploadedUrl = await getDownloadURL(imageRef);
      } catch (e) {
         console.error("Error uploading review photo", e);
      }
    }

    const newReview = {
      name: reviewForm.name,
      rating: Number(reviewForm.rating),
      text: reviewForm.text,
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      plantPhoto: uploadedUrl,
      approved: false
    };

    try {
      await addDoc(collection(db, 'reviews'), newReview);
      setReviewForm({ name: '', rating: 5, text: '', plantPhoto: null, previewUrl: '' });
      alert("Thank you! Your review has been submitted for approval.");
    } catch (error) {
      console.error("Error submitting review", error);
    }
    setIsSubmitting(false);
  };

  const handleReviewPhoto = (file) => {
    if (!file) return;
    setReviewForm((current) => ({ ...current, plantPhoto: file, previewUrl: URL.createObjectURL(file) }));
  };

  return (
    <main>
      <section id="home" className="relative min-h-screen overflow-hidden pt-20">
        <img src={heroImage} alt="Lush nursery with rows of plants" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-leaf-900/85 via-leaf-900/45 to-transparent" />
        <div className="container-page relative grid min-h-[calc(100vh-80px)] items-center py-16">
          <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl text-white">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
              <Sparkles size={17} /> Premium plants, landscaping, and care guidance
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-tight md:text-7xl">Kaveri Nursery</h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-leaf-50/90">
              Grow beautifully with healthy plants, thoughtful garden design, and expert care from seedling to shade.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#store" className="btn-primary bg-leaf-500 hover:bg-leaf-700"><Leaf size={19} /> Explore Plants</a>
              <a href="#contact" className="btn-secondary border-white/30 bg-white/20 text-white hover:bg-white/30"><MessageCircle size={19} /> Contact Us</a>
              <a href="#contact" className="btn-secondary border-white/30 bg-white/20 text-white hover:bg-white/30"><MapPin size={19} /> Visit Nursery</a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="-mt-16 relative z-10">
        <div className="container-page grid gap-5 md:grid-cols-3">
          <StatCard icon={Trees} value="52000" label="Plants sold" />
          <StatCard icon={Users} value="8600" label="Happy customers" />
          <StatCard icon={Award} value="18" label="Years of experience" />
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <SectionHeader center eyebrow="Nursery Highlights" title="Everything your garden needs, under one green roof" text="From carefully grown saplings to complete landscape makeovers, Kaveri Nursery blends horticulture knowledge with polished customer service." />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['Climate-smart plants', 'Native, indoor, flowering, medicinal, fruit, and farm-ready plants selected for local conditions.'],
              ['Care-first guidance', 'Every purchase includes watering, sunlight, soil, fertilizer, and seasonal care instructions.'],
              ['Landscape execution', 'Balcony gardens, villas, resorts, farms, and office green zones planned with practical maintenance.']
            ].map(([title, text]) => (
              <div key={title} className="glass card-hover rounded-2xl p-7">
                <CheckCircle2 className="mb-5 text-leaf-700 dark:text-leaf-300" />
                <h3 className="mb-3 text-2xl font-extrabold">{title}</h3>
                <p className="leading-7 text-leaf-900/70 dark:text-leaf-100/75">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="owner" className="section-pad bg-leaf-50 dark:bg-[#0c2411]">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative">
            <img src={owner.photo} alt={owner.name} className="h-[560px] w-full rounded-[2rem] object-cover shadow-glow" />
            <div className="glass absolute -bottom-7 left-7 right-7 rounded-2xl p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-soil dark:text-leaf-300">{owner.title}</p>
              <h3 className="font-display text-3xl font-bold">{owner.name}</h3>
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="About Owner" title="Built from a family garden into a trusted nursery destination" text={owner.story} />
            <div className="grid gap-4">
              {owner.achievements.map((item, index) => (
                <div key={item} className="glass flex gap-4 rounded-2xl p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf-700 font-bold text-white">{index + 1}</span>
                  <p className="font-semibold">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-leaf-900/60"><h4 className="mb-2 font-bold">Mission</h4><p>{owner.mission}</p></div>
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-leaf-900/60"><h4 className="mb-2 font-bold">Vision</h4><p>{owner.vision}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="section-pad">
        <div className="container-page">
          <SectionHeader eyebrow="Past Work" title="Landscaping, farm supply, and garden transformations" text="Browse selected projects with filtering, before-after comparison, and masonry-style project cards." />
          <div className="mb-8 flex flex-wrap gap-3">
            {projectCategories.map((category) => (
              <button key={category} onClick={() => setProjectCategory(category)} className={`rounded-full px-5 py-2 font-bold transition ${projectCategory === category ? 'bg-leaf-700 text-white' : 'bg-white text-leaf-900 dark:bg-leaf-900 dark:text-leaf-50'}`}>
                {category}
              </button>
            ))}
          </div>
          <div className="masonry">
            {filteredProjects.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-leaf-900/60">
                <img src={project.after} alt={project.title} className="h-auto w-full object-cover" />
                <div className="p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-soil dark:text-leaf-300">{project.category}</p>
                  <h3 className="mt-2 text-xl font-extrabold">{project.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-leaf-900/70 dark:text-leaf-100/75">{project.result}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button onClick={() => setSelectedProject(project)} className="btn-secondary px-4 py-2 text-sm">View Details</button>
                    <a
                      href={whatsappLink(`Hello Kaveri Nursery, I want to book a consultation for ${project.title}.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary bg-green-600 px-4 py-2 text-sm hover:bg-green-700"
                    >
                      <MessageCircle size={16} /> Book
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="knowledge" className="section-pad bg-leaf-50 dark:bg-[#0c2411]">
        <div className="container-page">
          <SectionHeader center eyebrow="Plant Knowledge" title="Learn what every plant needs before it reaches your home" text="Search plants by name, category, or scientific name and open care pages for full growth guidance." />
          <div className="glass mb-8 grid gap-4 rounded-2xl p-4 md:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-3 rounded-full bg-white px-4 py-3 dark:bg-leaf-900">
              <Search size={18} />
              <input value={plantQuery} onChange={(event) => setPlantQuery(event.target.value)} placeholder="Search plants, categories, sunlight needs..." className="w-full bg-transparent outline-none" />
            </label>
            <div className="flex flex-wrap gap-2">
              {plantCategories.map((category) => (
                <button key={category} onClick={() => setPlantCategory(category)} className={`rounded-full px-4 py-2 text-sm font-bold ${plantCategory === category ? 'bg-leaf-700 text-white' : 'bg-white dark:bg-leaf-900'}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlants.map((plant) => <PlantCard key={plant._id} plant={plant} />)}
          </div>
        </div>
      </section>

      <section id="store" className="section-pad">
        <div className="container-page">
          <SectionHeader eyebrow="Plant Store & Inventory" title="Fresh stock, fair pricing, and care-ready plants" text="Every card includes price, availability, discount badges, wishlist actions, and detailed plant care pages. Admins can manage the same plant records from the dashboard." />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {livePlants.length === 0 && <p className="text-leaf-900/70">No plants available in the store yet.</p>}
            {livePlants.slice(0, 6).map((plant) => <PlantCard key={plant._id} plant={plant} />)}
          </div>
        </div>
      </section>

      <section id="reviews" className="section-pad bg-leaf-50 dark:bg-[#0c2411]">
        <div className="container-page">
          <SectionHeader center eyebrow="Customer Reviews" title="Trusted by families, farms, offices, and garden lovers" text="Customers can rate purchases, write reviews, and upload plant photos. Admins approve or delete reviews from the dashboard." />
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-lg font-extrabold shadow-lg dark:bg-leaf-900">
              <Star className="fill-yellow-400 text-yellow-400" /> {averageRating} average rating
            </div>
          </div>
          <form onSubmit={submitReview} className="glass mb-10 rounded-[2rem] p-6">
            <h3 className="mb-5 text-2xl font-extrabold">Share Your Plant Review</h3>
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                  <input value={reviewForm.name} onChange={(event) => setReviewForm({ ...reviewForm, name: event.target.value })} placeholder="Your name" className="rounded-xl border border-leaf-700/20 bg-white px-4 py-3 outline-none dark:bg-leaf-900" />
                  <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })} className="rounded-xl border border-leaf-700/20 bg-white px-4 py-3 outline-none dark:bg-leaf-900">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <textarea value={reviewForm.text} onChange={(event) => setReviewForm({ ...reviewForm, text: event.target.value })} placeholder="Write your review" rows="4" className="rounded-xl border border-leaf-700/20 bg-white px-4 py-3 outline-none dark:bg-leaf-900" />
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-leaf-700/40 bg-white p-4 text-center font-bold text-leaf-700 dark:bg-leaf-900 dark:text-leaf-300">
                {reviewForm.previewUrl ? <img src={reviewForm.previewUrl} alt="Review plant preview" className="h-28 w-full rounded-lg object-cover" /> : <span>Upload plant photo</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => handleReviewPhoto(event.target.files?.[0])} />
              </label>
            </div>
            <button disabled={isSubmitting} className="btn-primary mt-5">{isSubmitting ? 'Submitting...' : 'Submit Review'}</button>
          </form>
          <div className="grid gap-6 md:grid-cols-3">
            {customerReviews.map((review) => (
              <article key={review.id} className="glass rounded-2xl p-6 card-hover">
                <div className="mb-4 flex items-center gap-3">
                  <img src={review.photo} alt={review.name} className="h-12 w-12 rounded-full object-cover" />
                  <div><h3 className="font-bold">{review.name}</h3><div className="flex text-yellow-400">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={15} className="fill-current" />)}</div></div>
                </div>
                <p className="leading-7 text-leaf-900/75 dark:text-leaf-100/75">{review.text}</p>
                <img src={review.plantPhoto} alt="Purchased plant" className="mt-5 h-40 w-full rounded-xl object-cover" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <SectionHeader eyebrow="Gardening Blog" title="Practical tips from the nursery floor" />
            <div className="grid gap-5">
              {blogs.map((blog) => (
                <article key={blog.id} className="grid gap-5 rounded-2xl bg-white p-4 shadow-lg dark:bg-leaf-900/60 md:grid-cols-[180px_1fr]">
                  <img src={blog.image} alt={blog.title} className="h-40 w-full rounded-xl object-cover md:h-full" />
                  <div className="p-2">
                    <h3 className="text-2xl font-extrabold">{blog.title}</h3>
                    <p className="mt-2 leading-7 text-leaf-900/70 dark:text-leaf-100/75">{blog.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="FAQ" title="Quick answers" />
            <div className="space-y-4">
              {faqs.map(([question, answer]) => (
                <details key={question} className="rounded-2xl bg-white p-5 shadow-lg open:ring-2 open:ring-leaf-300 dark:bg-leaf-900/60">
                  <summary className="cursor-pointer font-extrabold">{question}</summary>
                  <p className="mt-3 leading-7 text-leaf-900/70 dark:text-leaf-100/75">{answer}</p>
                </details>
              ))}
            </div>
            <div className="glass mt-6 rounded-2xl p-6">
              <h3 className="mb-3 text-2xl font-extrabold">Plant care reminders</h3>
              <p className="mb-4 text-leaf-900/70 dark:text-leaf-100/75">Subscribe to watering, fertilizer, pruning, and seasonal care reminders.</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input placeholder="Your email address" className="rounded-full border border-leaf-700/20 bg-white px-4 py-3 outline-none dark:bg-leaf-900" />
                <a href={whatsappLink('Hello Kaveri Nursery, I want to set plant care reminders.')} target="_blank" rel="noreferrer" className="btn-primary"><CalendarClock size={18} /> Subscribe</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section-pad bg-leaf-900 text-white">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeader eyebrow="Contact" title="Visit Kaveri Nursery or request a garden consultation" text="Call, WhatsApp, email, or send a message. The nursery team will help you choose plants that suit your space and season." />
            <div className="space-y-4 text-leaf-50">
              <p className="flex items-center gap-3"><Phone /> {businessInfo.phoneDisplay}</p>
              <p className="flex items-center gap-3"><Mail /> {businessInfo.email}</p>
              <p className="flex items-center gap-3"><MapPin /> {businessInfo.address}</p>
            </div>
            <a href={whatsappLink('Hello Kaveri Nursery, I want to book a nursery visit or garden consultation.')} target="_blank" rel="noreferrer" className="btn-primary mt-8 bg-green-500 hover:bg-green-600"><MessageCircle size={19} /> Book on WhatsApp</a>
          </div>
          <div className="grid gap-5">
            <form className="glass rounded-2xl p-6 text-leaf-900 dark:text-white">
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Name" className="rounded-xl border border-leaf-700/20 bg-white/80 px-4 py-3 outline-none dark:bg-leaf-900" />
                <input placeholder="Phone" className="rounded-xl border border-leaf-700/20 bg-white/80 px-4 py-3 outline-none dark:bg-leaf-900" />
              </div>
              <input placeholder="Email" className="mt-4 w-full rounded-xl border border-leaf-700/20 bg-white/80 px-4 py-3 outline-none dark:bg-leaf-900" />
              <textarea placeholder="Tell us about your plant or garden requirement" rows="5" className="mt-4 w-full rounded-xl border border-leaf-700/20 bg-white/80 px-4 py-3 outline-none dark:bg-leaf-900" />
              <button className="btn-primary mt-4 w-full">Send Message</button>
            </form>
            <iframe
              title="Kaveri Nursery Map"
              className="h-72 w-full rounded-2xl border-0"
              loading="lazy"
              src={mapUrl}
            />
            <a href={businessInfo.mapLink} target="_blank" rel="noreferrer" className="btn-secondary justify-center bg-white/10 text-white hover:bg-white/20">
              <MapPin size={18} /> Open Exact Google Maps Location
            </a>
          </div>
        </div>
      </section>

      {selectedProject && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-leaf-900/70 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-cream shadow-glow dark:bg-[#0c2411]">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[320px]">
                <img src={selectedProject.after} alt={selectedProject.title} className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-leaf-900">{selectedProject.category}</span>
              </div>
              <div className="p-6 md:p-8">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.2em] text-soil dark:text-leaf-300">Past Work Details</p>
                    <h3 className="font-display text-4xl font-extrabold">{selectedProject.title}</h3>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-leaf-900 shadow dark:bg-leaf-900 dark:text-white" aria-label="Close project details">
                    <X size={20} />
                  </button>
                </div>
                <p className="leading-8 text-leaf-900/75 dark:text-leaf-100/80">{selectedProject.scope}</p>
                <div className="my-6 grid gap-4 sm:grid-cols-3">
                  <Detail label="Location" value={selectedProject.location} />
                  <Detail label="Duration" value={selectedProject.duration} />
                  <Detail label="Package" value={selectedProject.budget} />
                </div>
                <div className="rounded-2xl bg-white p-5 shadow dark:bg-leaf-900/60">
                  <h4 className="mb-3 font-extrabold">Plants Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.plantsUsed.map((plant) => (
                      <span key={plant} className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-bold text-leaf-900 dark:bg-leaf-700 dark:text-white">{plant}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-white p-5 shadow dark:bg-leaf-900/60">
                  <h4 className="mb-2 font-extrabold">Result</h4>
                  <p className="leading-7 text-leaf-900/70 dark:text-leaf-100/75">{selectedProject.result}</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={whatsappLink(`Hello Kaveri Nursery, I saw your ${selectedProject.title} project and want to book a similar work.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle size={18} /> Book Similar Work
                  </a>
                  <a href="#contact" onClick={() => setSelectedProject(null)} className="btn-secondary">View Map</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow dark:bg-leaf-900/60">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-soil dark:text-leaf-300">{label}</p>
      <p className="mt-2 font-bold">{value}</p>
    </div>
  );
}
