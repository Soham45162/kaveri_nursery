import { Facebook, Instagram, Leaf, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { businessInfo } from '../data/sampleData.js';

export default function Footer() {
  return (
    <footer className="bg-leaf-900 text-leaf-50">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-leaf-500 text-white">
              <img src={businessInfo.logo} alt="Kaveri Nursery logo" className="relative z-10 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
              <Leaf className="absolute" />
            </span>
            <div>
              <h3 className="font-display text-2xl font-bold">Kaveri Nursery</h3>
              <p className="text-sm text-leaf-100">Rooted in trust, grown with care.</p>
            </div>
          </div>
          <p className="max-w-xl text-leaf-100">
            Premium plants, landscaping, garden design, farm saplings, and practical plant care guidance for every growing space.
          </p>
        </div>
        <div className="space-y-3 text-sm text-leaf-100">
          <p className="flex items-center gap-2"><MapPin size={17} /> {businessInfo.address}</p>
          <p className="flex items-center gap-2"><Phone size={17} /> {businessInfo.phoneDisplay}</p>
          <p className="flex items-center gap-2"><Mail size={17} /> {businessInfo.email}</p>
        </div>
        <div>
          <p className="mb-3 font-bold">Follow our garden work</p>
          <div className="flex gap-3">
            {[
              { Icon: Instagram, href: "https://instagram.com/" },
              { Icon: Facebook, href: "#" },
              { Icon: Linkedin, href: "#" }
            ].map(({ Icon, href }, index) => (
              <a key={index} href={href} target={href !== '#' ? "_blank" : undefined} rel={href !== '#' ? "noopener noreferrer" : undefined} aria-label="Social media" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-leaf-500">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-leaf-100">
        © 2026 Kaveri Nursery. All rights reserved.
      </div>
    </footer>
  );
}
