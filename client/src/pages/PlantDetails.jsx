import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Droplets, Sprout, Sun, Thermometer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

export default function PlantDetails() {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <main className="pt-28 section-pad"><div className="container-page text-center"><p className="text-xl font-bold">Loading plant details...</p></div></main>;
  if (!plant) return <main className="pt-28 section-pad"><div className="container-page text-center"><p className="text-xl font-bold mb-4">Plant not found.</p><Link to="/" className="btn-primary">Return Home</Link></div></main>;

  return (
    <main className="pt-28">
      <section className="section-pad">
        <div className="container-page">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 font-bold text-leaf-700 dark:text-leaf-300"><ArrowLeft size={18} /> Back to plants</Link>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <img src={plant.image} alt={plant.name} className="h-[560px] w-full rounded-[2rem] object-cover shadow-glow" />
            <div>
              <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.25em] text-soil dark:text-leaf-300">{plant.category}</p>
              <h1 className="font-display text-5xl font-extrabold">{plant.name}</h1>
              <p className="mt-2 text-xl italic text-leaf-900/60 dark:text-leaf-100/70">{plant.scientificName}</p>
              <p className="mt-5 text-lg leading-8 text-leaf-900/75 dark:text-leaf-100/80">{plant.description}</p>
              <div className="my-8 grid gap-4 sm:grid-cols-2">
                <Info icon={Droplets} label="Water" value={plant.water} />
                <Info icon={Sun} label="Sunlight" value={plant.sunlight} />
                <Info icon={Sprout} label="Soil" value={plant.soil} />
                <Info icon={Thermometer} label="Temperature" value={plant.temperature} />
              </div>
              {[
                ['Growth tips', plant.growthTips],
                ['Fertilizer tips', plant.fertilizer],
                ['Plant benefits', plant.benefits],
                ['Common diseases', plant.diseases],
                ['Seasonal care', plant.seasonalCare]
              ].map(([title, text]) => (
                <div key={title} className="mb-4 rounded-2xl bg-white p-5 shadow-lg dark:bg-leaf-900/60">
                  <h3 className="mb-2 font-extrabold">{title}</h3>
                  <p className="leading-7 text-leaf-900/70 dark:text-leaf-100/75">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="mb-3 text-leaf-700 dark:text-leaf-300" />
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf-900/55 dark:text-leaf-100/60">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
