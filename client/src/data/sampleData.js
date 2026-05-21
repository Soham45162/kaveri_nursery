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

export const plants = [
  {
    _id: '1',
    name: 'Areca Palm',
    scientificName: 'Dypsis lutescens',
    category: 'Indoor',
    price: 399,
    stock: 42,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=900&q=80',
    description: 'Elegant air-purifying palm for bright indoor corners.',
    water: 'Moderate, twice weekly',
    sunlight: 'Bright indirect light',
    soil: 'Well-drained loamy soil',
    temperature: '18-30°C',
    growthTips: 'Rotate the pot weekly and trim dry fronds.',
    fertilizer: 'Balanced liquid fertilizer monthly in growing season.',
    benefits: 'Improves humidity and indoor air quality.',
    diseases: 'Watch for spider mites and root rot.',
    seasonalCare: 'Reduce watering in winter and mist during dry summers.'
  },
  {
    _id: '2',
    name: 'Hibiscus',
    scientificName: 'Hibiscus rosa-sinensis',
    category: 'Flowering',
    price: 249,
    stock: 65,
    discount: 8,
    image: 'https://images.unsplash.com/photo-1621960559856-f4510e431c4c?auto=format&fit=crop&w=900&q=80',
    description: 'Bright tropical blooms ideal for sunny balconies and gardens.',
    water: 'Daily in summer',
    sunlight: 'Full sun',
    soil: 'Rich compost soil',
    temperature: '20-35°C',
    growthTips: 'Prune after flowering for bushy growth.',
    fertilizer: 'High potassium fertilizer every 20 days.',
    benefits: 'Attracts pollinators and adds vibrant color.',
    diseases: 'Aphids, mealybugs, and leaf spot.',
    seasonalCare: 'Protect from heavy rain and feed more during flowering months.'
  },
  {
    _id: '3',
    name: 'Tulsi',
    scientificName: 'Ocimum tenuiflorum',
    category: 'Medicinal',
    price: 99,
    stock: 120,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=900&q=80',
    description: 'Sacred medicinal herb with aromatic leaves and daily-use benefits.',
    water: 'Light daily watering',
    sunlight: 'Morning sun',
    soil: 'Sandy loam',
    temperature: '18-32°C',
    growthTips: 'Pinch flower spikes to keep leaves fresh.',
    fertilizer: 'Compost tea every month.',
    benefits: 'Used in herbal teas and traditional wellness routines.',
    diseases: 'Fungal wilt if overwatered.',
    seasonalCare: 'Keep warm in winter and avoid waterlogging.'
  },
  {
    _id: '4',
    name: 'Bougainvillea',
    scientificName: 'Bougainvillea glabra',
    category: 'Outdoor',
    price: 299,
    stock: 28,
    discount: 15,
    image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=900&q=80',
    description: 'Hardy sun-loving climber for gates, pergolas, and compound walls.',
    water: 'Low once established',
    sunlight: 'Full sun',
    soil: 'Fast-draining soil',
    temperature: '20-38°C',
    growthTips: 'Train on support and prune after each bloom cycle.',
    fertilizer: 'Low nitrogen fertilizer every 45 days.',
    benefits: 'Drought tolerant and excellent for colorful landscaping.',
    diseases: 'Leaf miners and scale insects.',
    seasonalCare: 'Avoid overwatering during monsoon.'
  },
  {
    _id: '5',
    name: 'Snake Plant',
    scientificName: 'Dracaena trifasciata',
    category: 'Indoor',
    price: 349,
    stock: 37,
    discount: 10,
    image: 'https://images.unsplash.com/photo-1593482892290-f54927ae2b0a?auto=format&fit=crop&w=900&q=80',
    description: 'Low-maintenance sculptural plant for homes and offices.',
    water: 'Low, every 10-14 days',
    sunlight: 'Low to bright indirect light',
    soil: 'Cactus mix',
    temperature: '16-32°C',
    growthTips: 'Use a pot with drainage and avoid wet leaves.',
    fertilizer: 'Diluted cactus fertilizer every two months.',
    benefits: 'Excellent beginner plant and air purifier.',
    diseases: 'Root rot from excess water.',
    seasonalCare: 'Water sparingly in winter.'
  },
  {
    _id: '6',
    name: 'Mango Sapling',
    scientificName: 'Mangifera indica',
    category: 'Fruit',
    price: 499,
    stock: 18,
    discount: 5,
    image: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&w=900&q=80',
    description: 'Healthy grafted sapling for farms and home orchards.',
    water: 'Deep watering twice weekly',
    sunlight: 'Full sun',
    soil: 'Deep fertile loam',
    temperature: '24-36°C',
    growthTips: 'Stake young plants and mulch the root zone.',
    fertilizer: 'Organic manure before monsoon and after harvest.',
    benefits: 'Long-term fruit yield and shade.',
    diseases: 'Powdery mildew and anthracnose.',
    seasonalCare: 'Protect young saplings from frost and strong winds.'
  }
];

export const projects = [
  {
    id: 1,
    title: 'Courtyard Herbal Garden',
    category: 'Garden Design',
    location: 'Mysuru residential courtyard',
    duration: '12 days',
    budget: 'Medium residential package',
    scope: 'Converted an unused courtyard into a functional herbal and flowering garden with walking stones, mulch, raised planters, and easy watering zones.',
    plantsUsed: ['Tulsi', 'Aloe Vera', 'Hibiscus', 'Jasmine', 'Marigold'],
    result: 'Low-maintenance family garden with edible herbs, seasonal blooms, and improved outdoor seating comfort.',
    before: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
    after: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    title: 'Resort Landscape Entrance',
    category: 'Landscaping',
    location: 'Boutique resort entrance',
    duration: '28 days',
    budget: 'Premium commercial package',
    scope: 'Designed a welcoming entrance landscape using palms, layered shrubs, flowering borders, pathway edging, and night-friendly plant placement.',
    plantsUsed: ['Areca Palm', 'Bougainvillea', 'Ixora', 'Croton', 'Ficus'],
    result: 'A polished first impression with hardy plants selected for heat, traffic, and year-round greenery.',
    before: 'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=900&q=80',
    after: 'https://images.unsplash.com/photo-1444392061186-9fc38f84f726?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    title: 'Farm Sapling Supply',
    category: 'Farm Work',
    location: 'Organic farm plantation',
    duration: '7 days',
    budget: 'Bulk sapling supply',
    scope: 'Supplied fruit saplings, soil amendment guidance, planting distance plan, and first-season care instructions for a farm block.',
    plantsUsed: ['Mango Sapling', 'Guava', 'Drumstick', 'Curry Leaf', 'Neem'],
    result: 'Healthy plantation setup with clear irrigation, mulching, and fertilizer schedule for the first growth cycle.',
    before: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80',
    after: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 4,
    title: 'Balcony Plant Makeover',
    category: 'Garden Design',
    location: 'Apartment balcony garden',
    duration: '3 days',
    budget: 'Starter balcony package',
    scope: 'Created a compact balcony plant layout with railing planters, statement pots, shade-tolerant foliage, and simple care reminders.',
    plantsUsed: ['Snake Plant', 'Areca Palm', 'Money Plant', 'Peace Lily', 'Herbs'],
    result: 'A fresh, usable balcony garden with better privacy, cleaner air, and beginner-friendly maintenance.',
    before: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    after: 'https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&w=900&q=80'
  }
];

export const reviews = [
  {
    id: 1,
    name: 'Ananya Sharma',
    rating: 5,
    text: 'Healthy plants, honest advice, and the balcony setup still looks fresh after six months.',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    plantPhoto: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Rahul Menon',
    rating: 5,
    text: 'Their team designed our farmhouse pathway with native plants that survive summer beautifully.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    plantPhoto: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Meera Iyer',
    rating: 4,
    text: 'The plant care reminders and fertilizer guidance made it easy for me as a beginner.',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    plantPhoto: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=600&q=80'
  }
];

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
