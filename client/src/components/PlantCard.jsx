import { Heart, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlantCard({ plant }) {
  const inStock = plant.stock > 0;

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-glow dark:bg-leaf-900/60">
      <div className="relative h-64 overflow-hidden">
        <img src={plant.image} alt={plant.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <div className="absolute left-4 top-4 flex flex-col gap-2 z-10">
          {plant.discount > 0 && <span className="rounded-full bg-soil px-3 py-1 text-sm font-bold text-white w-fit">{plant.discount}% OFF</span>}
          <span className={`rounded-full px-3 py-1 text-xxs font-extrabold text-white shadow-md backdrop-blur-sm w-fit uppercase tracking-wider ${
            (plant.careLevel || '').toLowerCase() === 'expert' ? 'bg-red-500/90' :
            (plant.careLevel || '').toLowerCase() === 'moderate' ? 'bg-amber-500/90' :
            'bg-green-600/90'
          }`}>
            {(plant.careLevel || 'Easy') + ' Care'}
          </span>
        </div>
        <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-leaf-900 transition hover:bg-leaf-100">
          <Heart size={18} />
        </button>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold">{plant.name}</h3>
            <p className="text-sm italic text-leaf-900/60 dark:text-leaf-100/70">{plant.scientificName}</p>
          </div>
          <span className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-bold text-leaf-900 dark:bg-leaf-700 dark:text-white">{plant.category}</span>
        </div>
        <p className="mb-4 min-h-[48px] text-sm leading-6 text-leaf-900/70 dark:text-leaf-100/75">{plant.description}</p>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl font-extrabold">₹{plant.price}</span>
          <span className={`flex items-center gap-1 text-sm font-bold ${inStock ? 'text-leaf-700 dark:text-leaf-300' : 'text-red-500'}`}>
            <Sprout size={16} /> {inStock ? `${plant.stock} in stock` : 'Out of stock'}
          </span>
        </div>
        <Link to={`/plants/${plant._id}`} className="btn-secondary w-full px-4">Read Care Details</Link>
      </div>
    </article>
  );
}
