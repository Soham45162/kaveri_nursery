import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import plantRoutes from './routes/plants.js';
import projectRoutes from './routes/projects.js';
import reviewRoutes from './routes/reviews.js';
import billRoutes from './routes/bills.js';
import labourRoutes from './routes/labours.js';
import labourLedgerRoutes from './routes/labourLedger.js';
import statRoutes from './routes/stats.js';
import settingRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/labours', labourRoutes);
app.use('/api', labourLedgerRoutes); // /api/attendance, /api/payments, /api/advances
app.use('/api/stats', statRoutes);
app.use('/api/settings', settingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), database: 'PostgreSQL 18' });
});

// Root handler
app.get('/', (req, res) => {
  res.send('Kaveri Nursery & Garden Centre - PostgreSQL Backend API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  Kaveri Nursery API Server Running on Port ${PORT}`);
  console.log(`  Database: PostgreSQL 18 (kaveri_nursery)`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
