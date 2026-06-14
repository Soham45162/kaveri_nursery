const publicAsset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export const heroImage =
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1800&q=85';

export const owner = {
  name: 'Ramnath Kedar',
  title: 'Founder & Horticulture Consultant',
  photo: publicAsset('/images/ramnath.jpeg'),
  story: 'Kaveri Nursery began as a family garden with 200 saplings and has grown into a trusted destination for home gardeners, farms, resorts, and landscape projects.',
  achievements: ['18+ years of plant care experience', 'Award-winning native plant collection', '750+ completed gardens'],
  mission: 'To make healthy, climate-smart plants accessible with honest guidance and lifelong care support.',
  vision: 'To help every home, farm, and workspace grow into a greener, calmer, more resilient place.'
};

export const businessInfo = {
  logo: publicAsset('/images/kaveri_logo.jpeg'),
  phoneDisplay: '+91 9850779272',
  whatsappNumber: '9850779272',
  email: 'ramnathkedar@gmail.com',
  address: 'Kaveri Nursery And Garden Centre B2, Sun Empire Rd, behind Artemis Society, Manik Baug, Anand Nagar, Pune, Maharashtra 411051',
  mapQuery: 'Kaveri Nursery And Garden Centre B2 Sun Empire Rd behind Artemis Society Manik Baug Anand Nagar Pune Maharashtra 411051',
  mapLink: 'https://maps.app.goo.gl/qrLAyRqkidNADV7W9'
};

export const plants = [];

export const projects = [];

export const reviews = [];

export const blogs = [
  {
    id: 1,
    title: 'Five Monsoon Care Rules for Potted Plants',
    excerpt: 'Drainage, pruning, pest checks, and feeding habits that keep roots healthy during rainy months.',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    title: 'Best Indoor Plants for Low-Light Homes',
    excerpt: 'A simple guide to choosing hardy indoor plants that stay beautiful with less sunlight.',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    title: 'How to Prepare Soil for Flowering Plants',
    excerpt: 'Compost ratios, aeration, mulch, and nutrition basics for stronger seasonal blooms.',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80'
  }
];

export const faqs = [
  ['Do you deliver plants?', 'Yes. Local deliveries are available with safe packing and care instructions.'],
  ['Can you design a complete garden?', 'Yes. We handle consultation, plant selection, installation, and maintenance plans.'],
  ['Do you provide plant care reminders?', 'Customers can register reminders for watering, fertilizer, pruning, and repotting.'],
  ['Can I buy in bulk for farms?', 'Yes. Farm saplings and bulk landscaping plants are available on request.']
];
