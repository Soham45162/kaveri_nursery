import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Menu, Moon, ShoppingBag, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { businessInfo } from '../data/sampleData.js';

const links = [
  ['Home', 'home'],
  ['Owner', 'owner'],
  ['Projects', 'projects'],
  ['Knowledge', 'knowledge'],
  ['Store', 'store'],
  ['Reviews', 'reviews'],
  ['Contact', 'contact']
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const goToSection = (id) => {
    setOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-cream/80 backdrop-blur-2xl dark:bg-[#07130a]/80">
      <nav className="container-page flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-leaf-700 text-white shadow-glow">
            <img src={businessInfo.logo} alt="Kaveri Nursery logo" className="relative z-10 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
            <Leaf size={22} className="absolute" />
          </span>
          <span>
            <span className="block font-display text-2xl font-bold leading-6">Kaveri</span>
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-soil dark:text-leaf-300">Nursery</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([label, id]) => (
            <button
              key={id}
              onClick={() => goToSection(id)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-leaf-900/80 transition hover:bg-leaf-100 hover:text-leaf-900 dark:text-leaf-50 dark:hover:bg-leaf-900"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="grid h-11 w-11 place-items-center rounded-full border border-leaf-700/20 bg-white/70 text-leaf-900 transition hover:bg-leaf-100 dark:bg-leaf-900/50 dark:text-leaf-50"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            onClick={() => goToSection('store')}
            aria-label="Open store"
            className="hidden h-11 w-11 place-items-center rounded-full bg-leaf-700 text-white transition hover:bg-leaf-900 md:grid"
          >
            <ShoppingBag size={19} />
          </button>
          <Link to="/admin" className="hidden rounded-full bg-soil px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 md:inline-flex">
            Admin
          </Link>
          <button
            onClick={() => setOpen((current) => !current)}
            aria-label="Toggle menu"
            className="grid h-11 w-11 place-items-center rounded-full bg-leaf-700 text-white lg:hidden"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="container-page pb-5 lg:hidden">
          <div className="glass grid gap-2 rounded-2xl p-3">
            {links.map(([label, id]) => (
              <button key={id} onClick={() => goToSection(id)} className="rounded-xl px-4 py-3 text-left font-semibold hover:bg-leaf-100 dark:hover:bg-leaf-900">
                {label}
              </button>
            ))}
            <Link onClick={() => setOpen(false)} to="/admin" className="rounded-xl bg-leaf-700 px-4 py-3 font-semibold text-white">
              Admin Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
