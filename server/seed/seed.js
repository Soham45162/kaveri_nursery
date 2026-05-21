import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB, { pool, query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const plantData = [
  {
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
    seasonalCare: 'Reduce watering in winter and mist during dry summers.',
    isFeatured: true
  },
  {
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
    seasonalCare: 'Protect from heavy rain and feed more during flowering months.',
    isFeatured: true
  },
  {
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
    seasonalCare: 'Keep warm in winter and avoid waterlogging.',
    isFeatured: false
  }
];

async function insertPlant(plant) {
  const result = await query(
    `INSERT INTO plants (
      name, scientific_name, category, price, stock, discount, image, description,
      water, sunlight, soil, temperature, growth_tips, fertilizer, benefits,
      diseases, seasonal_care, is_featured
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING id`,
    [
      plant.name,
      plant.scientificName,
      plant.category,
      plant.price,
      plant.stock,
      plant.discount,
      plant.image,
      plant.description,
      plant.water,
      plant.sunlight,
      plant.soil,
      plant.temperature,
      plant.growthTips,
      plant.fertilizer,
      plant.benefits,
      plant.diseases,
      plant.seasonalCare,
      plant.isFeatured
    ]
  );
  return result.rows[0].id;
}

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for seeding');
  await connectDB();

  await query('TRUNCATE reviews, gallery, orders, contacts, newsletters, plants, users RESTART IDENTITY CASCADE');

  const hashedPassword = await bcrypt.hash('Soham@123', 12);
  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')`,
    ['Soham Kedar', 'sohamkedar02@gmail.com', hashedPassword]
  );

  const plantIds = [];
  for (const plant of plantData) {
    plantIds.push(await insertPlant(plant));
  }

  await query(
    `INSERT INTO gallery (title, category, image, before_image, after_image, featured)
     VALUES
     ($1, $2, $3, $4, $5, TRUE),
     ($6, $7, $8, NULL, NULL, TRUE)`,
    [
      'Courtyard Herbal Garden',
      'Garden Design',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80',
      'Farm Sapling Supply',
      'Farm Work',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80'
    ]
  );

  await query(
    `INSERT INTO reviews (name, email, rating, text, plant_id, approved)
     VALUES
     ($1, $2, 5, $3, $4, TRUE),
     ($5, $6, 5, $7, $8, TRUE)`,
    [
      'Ananya Sharma',
      'ananya@example.com',
      'Healthy plants and very clear care instructions.',
      plantIds[0],
      'Rahul Menon',
      'rahul@example.com',
      'Excellent landscaping support for our farmhouse.',
      plantIds[1]
    ]
  );

  console.log('Kaveri Nursery PostgreSQL database seeded');
  await pool.end();
}

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
