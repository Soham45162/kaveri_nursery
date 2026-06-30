import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Droplets, Sun, Sprout, Thermometer, 
  Activity, ShieldAlert, Sparkles, HeartPulse, ClipboardCheck, Calendar
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

export default function PlantDetails() {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGuideTab, setActiveGuideTab] = useState('care'); // 'care', 'fertilizer', 'disease', 'benefits'

  useEffect(() => {
    async function loadPlant() {
      try {
        const docSnap = await getDoc(doc(db, 'plants', id));
        if (docSnap.exists()) {
          setPlant({ _id: docSnap.id, ...docSnap.data() });
        }
      } catch (e) {
        console.error("Error fetching plant details", e);
      }
      setLoading(false);
    }
    loadPlant();
  }, [id]);

  useEffect(() => {
    if (!plant) return;

    // Structured JSON-LD Data for SEO
    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": plant.name,
      "image": plant.image,
      "description": plant.description,
      "category": plant.category,
      "offers": {
        "@type": "Offer",
        "price": plant.price || "0",
        "priceCurrency": "INR",
        "availability": plant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Scientific Name",
          "value": plant.scientificName || "N/A"
        },
        {
          "@type": "PropertyValue",
          "name": "Watering Schedule",
          "value": plant.waterSchedule || plant.water || "N/A"
        },
        {
          "@type": "PropertyValue",
          "name": "Sunlight Requirement",
          "value": plant.sunlightReq || plant.sunlight || "N/A"
        },
        {
          "@type": "PropertyValue",
          "name": "Care Level",
          "value": (plant.careLevel || "Easy") + " Care"
        },
        {
          "@type": "PropertyValue",
          "name": "Growth Rate",
          "value": plant.growthRate || "N/A"
        },
        {
          "@type": "PropertyValue",
          "name": "Soil Type",
          "value": plant.soilType || plant.soil || "N/A"
        },
        {
          "@type": "PropertyValue",
          "name": "Blooming Season",
          "value": plant.bloomingSeason || "N/A"
        }
      ]
    };

    // Inject JSON-LD to HEAD
    let scriptElement = document.getElementById("structured-data-plant");
    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.id = "structured-data-plant";
      scriptElement.type = "application/ld+json";
      document.head.appendChild(scriptElement);
    }
    scriptElement.text = JSON.stringify(jsonLdData);

    // Update document title and meta description
    document.title = `${plant.name} (${plant.scientificName || 'Botanical Guide'}) - Care & Growth Center | Kaveri Nursery`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `Learn how to grow ${plant.name} (${plant.scientificName}). Read comprehensive specifications, including watering schedule, sunlight needs, soil, growth rate, blooming, diseases, and care tips.`);

    return () => {
      // Clean up JSON-LD script and restore title/meta on unmount
      const existingScript = document.getElementById("structured-data-plant");
      if (existingScript) existingScript.remove();
      document.title = "Kaveri Nursery - Premium Plants & Landscaping";
      const defaultDesc = document.querySelector('meta[name="description"]');
      if (defaultDesc) defaultDesc.setAttribute('content', 'Modern responsive nursery management website for Kaveri Nursery.');
    };
  }, [plant]);

  if (loading) return <main className="pt-28 section-pad"><div className="container-page text-center"><p className="text-xl font-bold">Loading plant details...</p></div></main>;
  if (!plant) return <main className="pt-28 section-pad"><div className="container-page text-center"><p className="text-xl font-bold mb-4">Plant not found.</p><Link to="/" className="btn-primary">Return Home</Link></div></main>;

  const normalizedCareLevel = (plant.careLevel || 'Easy').toLowerCase();

  return (
    <main className="pt-28 min-h-screen bg-cream/10 dark:bg-leaf-950/20 text-leaf-900 dark:text-leaf-50">
      <section className="section-pad">
        <div className="container-page">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 font-bold text-leaf-700 dark:text-leaf-300 transition hover:underline">
            <ArrowLeft size={18} /> Back to Nursery
          </Link>
          
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Image Section */}
            <div className="relative">
              <img 
                src={plant.image} 
                alt={plant.name} 
                className="h-[480px] sm:h-[580px] w-full rounded-[2.5rem] object-cover shadow-glow border border-leaf-700/5" 
              />
              <span className={`absolute left-6 top-6 rounded-full px-4 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur uppercase tracking-wider ${
                normalizedCareLevel === 'expert' ? 'bg-red-500/90' :
                normalizedCareLevel === 'moderate' ? 'bg-amber-500/90' :
                'bg-green-600/90'
              }`}>
                {(plant.careLevel || 'Easy') + ' Care'}
              </span>
            </div>

            {/* Content Details Section */}
            <div className="text-left flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-leaf-100 text-leaf-800 text-xxs font-extrabold uppercase tracking-widest mb-4 dark:bg-[#0c2411] dark:text-leaf-100">
                  {plant.category}
                </span>
                
                <h1 className="font-display text-4xl sm:text-5xl font-black text-leaf-900 dark:text-white leading-tight">
                  {plant.name}
                </h1>
                
                <p className="mt-1 text-lg italic text-soil dark:text-leaf-300/80 font-semibold font-mono">
                  {plant.scientificName}
                </p>

                <p className="mt-6 text-base leading-relaxed text-leaf-900/70 dark:text-leaf-100/75 max-w-xl">
                  {plant.description}
                </p>

                {/* Grid of specifications */}
                <div className="my-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
                  <Info icon={Droplets} label="Watering" value={plant.waterSchedule || plant.water || 'Moderate'} />
                  <Info icon={Sun} label="Sunlight" value={plant.sunlightReq || plant.sunlight || 'Indirect Light'} />
                  <Info icon={Activity} label="Growth Rate" value={plant.growthRate || 'Moderate'} />
                  <Info icon={Thermometer} label="Temperature" value={plant.temperature || '18-32°C'} />
                </div>

                {/* Botanical specs list */}
                <div className="mb-8 rounded-3xl bg-white/50 p-6 border border-leaf-700/5 dark:bg-leaf-900/20 backdrop-blur-sm">
                  <h3 className="text-sm font-extrabold text-soil dark:text-leaf-300 uppercase tracking-widest mb-4">Botanical Specifications</h3>
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
                    <div className="flex justify-between border-b border-leaf-700/10 pb-2">
                      <span className="text-leaf-900/60 dark:text-leaf-100/60 font-semibold">Soil Type:</span>
                      <strong className="text-leaf-950 dark:text-white">{plant.soilType || plant.soil || 'Well-draining'}</strong>
                    </div>
                    <div className="flex justify-between border-b border-leaf-700/10 pb-2">
                      <span className="text-leaf-900/60 dark:text-leaf-100/60 font-semibold">Blooming Season:</span>
                      <strong className="text-leaf-950 dark:text-white">{plant.bloomingSeason || 'Spring/Summer'}</strong>
                    </div>
                    <div className="flex justify-between border-b border-leaf-700/10 pb-2 sm:border-0 sm:pb-0">
                      <span className="text-leaf-900/60 dark:text-leaf-100/60 font-semibold">Stock Status:</span>
                      <strong className={plant.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                        {plant.stock > 0 ? `${plant.stock} Varieties` : 'Out of stock'}
                      </strong>
                    </div>
                    <div className="flex justify-between sm:border-0 sm:pb-0">
                      <span className="text-leaf-900/60 dark:text-leaf-100/60 font-semibold">Retail Price:</span>
                      <strong className="text-leaf-950 dark:text-white">₹{plant.price}</strong>
                    </div>
                  </div>
                </div>

                {/* Guides tabs container */}
                <div className="rounded-[2rem] bg-white border border-leaf-700/5 p-6 shadow-xl dark:bg-leaf-900/40">
                  <div className="flex flex-wrap gap-2 border-b border-leaf-700/10 pb-4 mb-4">
                    {[
                      { id: 'care', label: 'Care Tips', icon: Sparkles },
                      { id: 'fertilizer', label: 'Fertilizer Guide', icon: Sprout },
                      { id: 'disease', label: 'Diseases & Treatment', icon: ShieldAlert },
                      { id: 'benefits', label: 'Benefits', icon: HeartPulse }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveGuideTab(tab.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeGuideTab === tab.id
                              ? 'bg-leaf-700 text-white shadow-md'
                              : 'bg-leaf-50 hover:bg-leaf-100 dark:bg-leaf-900 dark:hover:bg-leaf-800'
                          }`}
                        >
                          <Icon size={13} /> {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="min-h-[140px] text-sm leading-relaxed text-leaf-900/80 dark:text-leaf-100/80">
                    {activeGuideTab === 'care' && (
                      <div className="animate-in fade-in duration-200">
                        <h4 className="font-extrabold text-base mb-2">Growth & Care Tips</h4>
                        <p>{plant.careTips || plant.growthTips || 'Provide organic care, avoid overwatering, and ensure adequate light.'}</p>
                        {plant.seasonalCare && (
                          <div className="mt-4 p-3.5 bg-leaf-50/50 rounded-xl border border-leaf-700/5 text-xxs flex items-start gap-2 dark:bg-[#0c2411]">
                            <Calendar size={14} className="text-soil dark:text-leaf-300 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-soil dark:text-leaf-300 uppercase block font-black mb-1">Seasonal Care Notes</strong>
                              <span>{plant.seasonalCare}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeGuideTab === 'fertilizer' && (
                      <div className="animate-in fade-in duration-200">
                        <h4 className="font-extrabold text-base mb-2">Fertilization Guide</h4>
                        <p>{plant.fertilizerGuide || plant.fertilizer || 'Add balanced organic compost monthly during spring and summer growing cycles.'}</p>
                      </div>
                    )}

                    {activeGuideTab === 'disease' && (
                      <div className="animate-in fade-in duration-200 space-y-4">
                        <div>
                          <h4 className="font-extrabold text-base mb-1.5 flex items-center gap-1.5"><ShieldAlert size={16} className="text-red-500" /> Common Pests & Diseases</h4>
                          <p>{plant.commonDiseases || plant.diseases || 'Generally hardy, occasionally susceptible to aphids or root rot if overwatered.'}</p>
                        </div>
                        <div className="pt-2 border-t border-leaf-700/5">
                          <h4 className="font-extrabold text-base mb-1.5">Disease Treatment Guide</h4>
                          <p>{plant.diseaseTreatment || 'Prune affected leaves, ensure proper ventilation, and spray neem oil diluted in water.'}</p>
                        </div>
                      </div>
                    )}

                    {activeGuideTab === 'benefits' && (
                      <div className="animate-in fade-in duration-200">
                        <h4 className="font-extrabold text-base mb-2">Botanical & Ecological Benefits</h4>
                        <p>{plant.benefits || 'Enhances garden design aesthetics, supports local biodiversity, and filters outdoor/indoor microclimate air.'}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col justify-between min-h-[95px] border border-leaf-700/5">
      <Icon className="text-leaf-700 dark:text-leaf-300" size={20} />
      <div className="mt-2 text-left">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-leaf-900/50 dark:text-leaf-100/50">{label}</p>
        <p className="mt-0.5 text-xs font-black truncate text-leaf-900 dark:text-white" title={value}>{value}</p>
      </div>
    </div>
  );
}
