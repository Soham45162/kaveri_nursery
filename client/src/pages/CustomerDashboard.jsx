import { CalendarClock, Heart, Leaf, LogOut, MessageCircle, Package, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { businessInfo, plants } from '../data/sampleData.js';

const whatsappLink = `https://wa.me/${businessInfo.whatsappNumber}?text=${encodeURIComponent('Hello Kaveri Nursery, I need help with plants or booking.')}`;

export default function CustomerDashboard() {
  const { logout, user } = useAuth();

  return (
    <main className="pt-24">
      <section className="section-pad bg-leaf-50 dark:bg-[#0c2411]">
        <div className="container-page">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-soil dark:text-leaf-300">Customer Dashboard</p>
              <h1 className="font-display text-5xl font-extrabold">Welcome, {user?.name || 'Customer'}</h1>
            </div>
            <button onClick={logout} className="btn-secondary"><LogOut size={18} /> Logout</button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <DashboardCard icon={Leaf} title="Plant Care" text="View care details for watering, sunlight, soil, and seasonal tips." />
            <DashboardCard icon={CalendarClock} title="Reminders" text="Request watering, fertilizer, pruning, and repotting reminders." />
            <DashboardCard icon={Star} title="Reviews" text="Share your plant review and photo from the customer review section." />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-extrabold"><Heart /> Recommended Plants</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {plants.slice(0, 4).map((plant) => (
                  <article key={plant._id} className="flex gap-4 rounded-2xl bg-leaf-50 p-4 dark:bg-[#0c2411]">
                    <img src={plant.image} alt={plant.name} className="h-24 w-24 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-extrabold">{plant.name}</h3>
                      <p className="text-sm text-leaf-900/70 dark:text-leaf-100/75">{plant.description}</p>
                      <p className="mt-2 text-sm font-bold text-leaf-700 dark:text-leaf-300">{plant.stock} in stock</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] bg-white p-6 shadow-lg dark:bg-leaf-900/60">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-extrabold"><Package /> Need Help?</h2>
              <p className="mb-5 leading-7 text-leaf-900/70 dark:text-leaf-100/75">
                Contact Kaveri Nursery for plant care, visit booking, landscaping, or nursery product questions.
              </p>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary bg-green-600 hover:bg-green-700">
                <MessageCircle size={18} /> WhatsApp Nursery
              </a>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({ icon: Icon, title, text }) {
  return (
    <div className="glass rounded-2xl p-6">
      <Icon className="mb-4 text-leaf-700 dark:text-leaf-300" />
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="mt-2 leading-7 text-leaf-900/70 dark:text-leaf-100/75">{text}</p>
    </div>
  );
}
